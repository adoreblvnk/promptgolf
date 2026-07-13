# Deploy PromptGolf on Google Cloud

Last verified against Google Cloud documentation: 2026-07-13.

This guide moves PromptGolf from Vercel to a production-safe Google Cloud architecture in Singapore. It covers the required application refactor, infrastructure, deployment, DNS cutover, verification, and rollback.

## Target architecture

```text
Browser
  │
  ▼
Cloud Run: promptgolf-web (public)
  ├── Next.js pages and public API
  ├── creates Firestore run document
  ├── enqueues Cloud Task
  └── reads run state and proxies approved previews
              │
              ▼
Cloud Tasks: promptgolf-live-runs
              │ authenticated OIDC request
              ▼
Cloud Run: promptgolf-worker (private, concurrency 1)
  ├── OpenAI builder orchestration
  ├── Daytona sandbox lifecycle
  ├── Playwright evaluation with container Chromium
  ├── writes progress/results to Firestore
  └── writes large artifacts to Cloud Storage

Supporting services:
  Firestore       durable run state and capped event history
  Cloud Storage   screenshots and generated workspace artifacts
  Secret Manager  OpenAI and Daytona credentials
  Artifact Registry + Cloud Build  container builds
  Cloud Logging / Monitoring       logs, metrics, and alerts
```

Use `asia-southeast1` for Cloud Run, Cloud Tasks, Artifact Registry, Firestore, and Cloud Storage where supported. Keeping the services in Singapore reduces latency and avoids unnecessary cross-region traffic.

## Why the code must change first

The current implementation is deliberately process-local:

- `src/lib/promptgolf/live-run-store.ts` stores runs in a global in-memory `Map`.
- `src/lib/promptgolf/run-scheduler.ts` starts background promises in the web process.
- SSE subscribers are attached to that same process.

Cloud Run containers are stateless and may restart or scale independently. Deploying the current code unchanged would still lose runs and route polling to instances that do not have the corresponding state.

The migration must therefore replace:

| Current component | GCP replacement |
| --- | --- |
| In-memory `LiveRun` map | Firestore repository |
| Process-local FIFO scheduler | Cloud Tasks |
| Fire-and-forget evaluation | Authenticated private worker request |
| Local event subscribers | Polling or Firestore-backed SSE |
| Large workspace/screenshots in memory | Cloud Storage references |
| Local Playwright browser cache | Chromium installed in the worker image |
| `.env` production secrets | Secret Manager |

Do not switch DNS until these replacements pass staging verification.

## 1. Prerequisites

You need:

- A Google Cloud project with billing and the credits attached.
- Owner or equivalent provisioning permissions during initial setup.
- Control of DNS for `promptgolf.dev`.
- Google Cloud CLI installed and authenticated.
- Docker or Cloud Build access.
- The PromptGolf repository checked out locally.

Authenticate and select the project:

```bash
gcloud auth login
gcloud auth application-default login

export PROJECT_ID="your-gcp-project-id"
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
export REGION="asia-southeast1"
export REPOSITORY="promptgolf"
export IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/promptgolf"
export WEB_SERVICE="promptgolf-web"
export WORKER_SERVICE="promptgolf-worker"
export QUEUE="promptgolf-live-runs"
export BUCKET="${PROJECT_ID}-promptgolf-artifacts"

gcloud config set project "$PROJECT_ID"
gcloud config set run/region "$REGION"
```

Verify that billing is enabled before provisioning anything:

```bash
gcloud billing projects describe "$PROJECT_ID"
```

Create a budget and email alerts in **Billing → Budgets & alerts**. Credits reduce the bill but do not prevent runaway usage.

## 2. Enable the required APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  certificatemanager.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  firestore.googleapis.com \
  iamcredentials.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  storage.googleapis.com \
  cloudtasks.googleapis.com
```

Confirm the APIs are enabled:

```bash
gcloud services list --enabled \
  --filter='NAME:(run.googleapis.com OR firestore.googleapis.com OR cloudtasks.googleapis.com OR secretmanager.googleapis.com)'
```

## 3. Create service accounts

Use separate identities so the public web service cannot read provider secrets or execute worker-only operations.

```bash
gcloud iam service-accounts create promptgolf-web \
  --display-name="PromptGolf web service"

gcloud iam service-accounts create promptgolf-worker \
  --display-name="PromptGolf evaluation worker"

gcloud iam service-accounts create promptgolf-task-invoker \
  --display-name="PromptGolf Cloud Tasks invoker"

export WEB_SA="promptgolf-web@${PROJECT_ID}.iam.gserviceaccount.com"
export WORKER_SA="promptgolf-worker@${PROJECT_ID}.iam.gserviceaccount.com"
export TASK_INVOKER_SA="promptgolf-task-invoker@${PROJECT_ID}.iam.gserviceaccount.com"
```

Grant both runtime identities Firestore access. Firestore's predefined data roles are granted at project scope, so use a dedicated PromptGolf GCP project rather than sharing this project with unrelated workloads:

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/datastore.user"
```

Storage, Secret Manager, and Cloud Tasks grants are applied to their individual resources in the sections that create those resources. Do not grant their runtime roles project-wide.

Allow the web service to attach the task invoker identity to Cloud Tasks requests:

```bash
gcloud iam service-accounts add-iam-policy-binding "$TASK_INVOKER_SA" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/iam.serviceAccountUser"
```

Do not create downloadable service-account keys. Cloud Run uses attached service identities and Application Default Credentials.

## 4. Create Firestore

The database location is effectively a long-term choice. Use Firestore Native mode in Singapore:

```bash
gcloud firestore databases create \
  --database='(default)' \
  --location="$REGION" \
  --type=firestore-native \
  --delete-protection
```

If the project already has a database, inspect it instead of creating another:

```bash
gcloud firestore databases describe --database='(default)'
```

### Suggested run document

Store one capped document per live run at `liveRuns/{runId}`:

```text
id
challengeSlug
prompt                    server-only; never return from the public API
status                    queued | running | completed | failed
enqueueState              pending | accepted | unknown
stage                     queued | generate | sandbox | test | score | completed | failed
createdAt
updatedAt
expiresAt                 Firestore timestamp used for TTL
attempt
leaseOwner
leaseExpiresAt
leaseGeneration           monotonically increasing fencing token
providerMode
sandboxMode
previewTarget             server-only signed Daytona target
previewLabel
tests[]
score
diagnosis
providerState[]
events[]                  capped at 200; each message capped at 1,000 chars
artifactObject            Cloud Storage object name, not workspace bytes
error                     redacted, bounded public-safe message
```

Keep events in the parent document rather than a subcollection for the first version. Firestore TTL deletion does not recursively delete subcollections. The current event limits keep the document below Firestore's 1 MiB document limit, provided workspaces and screenshots remain in Cloud Storage.

Enable TTL after the application writes `expiresAt` timestamps:

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=liveRuns \
  --enable-ttl

gcloud firestore fields ttls update expiresAt \
  --collection-group=submissionLimits \
  --enable-ttl
```

Use a seven-day retention period initially. The application sets `expiresAt = createdAt + 7 days`; Firestore performs deletion asynchronously.

## 5. Create the artifact bucket

```bash
gcloud storage buckets create "gs://${BUCKET}" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --uniform-bucket-level-access

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/storage.objectViewer"

gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/storage.objectAdmin"
```

Keep the bucket private. The browser should receive artifacts through authorized application routes or short-lived signed URLs, not public object URLs.

Recommended object layout:

```text
live-runs/{runId}/workspace.json.gz
live-runs/{runId}/desktop.png
live-runs/{runId}/mobile.png
live-runs/{runId}/evaluation.json
```

Add a lifecycle rule matching the run retention period after staging is stable. Do not rely only on Firestore TTL; deleting a Firestore document does not delete its Cloud Storage objects.

## 6. Create secrets

Create empty secret resources:

```bash
gcloud secrets create openai-api-key --replication-policy=automatic
gcloud secrets create daytona-api-key --replication-policy=automatic

gcloud secrets add-iam-policy-binding openai-api-key \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding daytona-api-key \
  --member="serviceAccount:${WORKER_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

Add values without placing them in command history:

```bash
read -rsp 'OpenAI API key: ' OPENAI_API_KEY && printf '\n'
printf '%s' "$OPENAI_API_KEY" | gcloud secrets versions add openai-api-key --data-file=-
unset OPENAI_API_KEY

read -rsp 'Daytona API key: ' DAYTONA_API_KEY && printf '\n'
printf '%s' "$DAYTONA_API_KEY" | gcloud secrets versions add daytona-api-key --data-file=-
unset DAYTONA_API_KEY
```

Verify metadata only; never print secret payloads:

```bash
gcloud secrets versions list openai-api-key
gcloud secrets versions list daytona-api-key
```

## 7. Create the Cloud Tasks queue

Start with low concurrency because each run consumes OpenAI, Daytona, and browser resources:

```bash
gcloud tasks queues create "$QUEUE" \
  --location="$REGION" \
  --max-concurrent-dispatches=2 \
  --max-dispatches-per-second=1 \
  --max-attempts=3 \
  --max-retry-duration=7200s \
  --min-backoff=30s \
  --max-backoff=300s \
  --max-doublings=3 \
  --log-sampling-ratio=1.0

gcloud tasks queues add-iam-policy-binding "$QUEUE" \
  --location="$REGION" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/cloudtasks.enqueuer"

gcloud tasks queues add-iam-policy-binding "$QUEUE" \
  --location="$REGION" \
  --member="serviceAccount:${WEB_SA}" \
  --role="roles/cloudtasks.viewer"
```

Verify it:

```bash
gcloud tasks queues describe "$QUEUE" --location="$REGION"
```

Each task should:

- Use a deterministic task name derived from the run ID, preventing accidental duplicate enqueueing.
- Send only `{ "runId": "..." }`; the worker reads the prompt from Firestore.
- Target the worker's `run.app` URL plus `/internal/tasks/live-runs`.
- Use an OIDC token from `promptgolf-task-invoker`.
- Set the audience to the worker's base `run.app` URL.
- Set a dispatch deadline of 1,740 seconds.

Cloud Tasks HTTP handlers have a maximum 30-minute dispatch deadline. Give the application a 1,620-second execution budget, the task a 1,740-second dispatch deadline, and Cloud Run a 1,800-second timeout. The margins let the worker persist failure state and clean up before infrastructure terminates or retries it.

## 8. Refactor the application

Complete this section before deploying production traffic.

### 8.1 Introduce a repository boundary

Replace direct calls to the process-local map with a `LiveRunRepository` abstraction. It should support:

```text
create(input)
get(id)
update(id, patch)
appendEvent(id, event)
claim(id, workerId, leaseDuration)
complete(id, result)
fail(id, publicError)
```

Implement:

- `MemoryLiveRunRepository` for unit tests and explicit provider-stub development.
- `FirestoreLiveRunRepository` for staging and production.

Firestore updates that append events or claim work must use transactions. Keep event numbering monotonic and cap the event array at 200 entries in the same transaction. Coalesce bursty progress updates before writing so one run does not create avoidable contention on a single Firestore document; terminal state and lease heartbeats must not be delayed behind that buffer.

### 8.2 Replace the scheduler with Cloud Tasks

`POST /api/live-runs` should:

1. Validate origin, distributed rate limits, challenge, prompt length, and the operator submission kill switch.
2. Create the Firestore run with `queued` state and a seven-day `expiresAt`.
3. Create a Cloud Task named from the run ID.
4. Return `202` with the run URL.
5. Reconcile task creation before changing the run when enqueueing returns an error.

Task creation is not safely classified by the first client error: a timeout can occur after Cloud Tasks accepted the deterministic task name. Retry `CreateTask` with the same name; treat `ALREADY_EXISTS` as success, and use `GetTask` when the result remains ambiguous. Do not mark the run failed while an accepted task may still execute. Persist `enqueueState=unknown` and alert for reconciliation if neither success nor absence can be proven.

The web route must not eagerly import `live-runner.ts`, Playwright, or the Daytona SDK. Keep provider and browser imports behind the private worker boundary so a public API cold start cannot fail while loading worker-only packages.

#### Distributed submission protection

The existing process-local limiter is suitable only for local development; it resets on restart and does not coordinate Cloud Run instances. Before attaching real provider secrets to a publicly reachable deployment:

1. Replace it with a Firestore transaction-backed quota keyed by a one-way hash of the normalized client identity and time window. Store no raw IP address, set a short `expiresAt`, and reject before creating the run or task.
2. Put a Cloud Armor policy on the load-balancer backend with a conservative per-IP throttle for `POST /api/live-runs`. Start the rule in preview, inspect legitimate traffic, then enforce it before production cutover.
3. Keep queue dispatch concurrency and worker maximum instances low, and provide an operator kill switch that pauses the queue.
4. Add a project budget alert, provider-side spend limits where available, and alerts for submission rejection rate and queued-run growth.

A shared application quota plus edge throttling is a production blocker because every accepted anonymous submission can incur OpenAI and Daytona spend. Cloud Armor alone is not an identity or global-budget control.

Use these production packages:

```bash
npm install @google-cloud/firestore @google-cloud/storage @google-cloud/tasks
```

The publisher shape should be equivalent to:

```ts
const [task] = await tasksClient.createTask({
  parent: tasksClient.queuePath(projectId, region, queueName),
  task: {
    name: tasksClient.taskPath(projectId, region, queueName, runId),
    dispatchDeadline: { seconds: 1740 },
    httpRequest: {
      httpMethod: "POST",
      url: `${workerUrl}/internal/tasks/live-runs`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify({ runId })).toString("base64"),
      oidcToken: {
        serviceAccountEmail: taskInvokerServiceAccount,
        audience: workerUrl,
      },
    },
  },
});
```

Do not place the contestant prompt, provider keys, or signed preview URL in the Cloud Task payload.

### 8.3 Add an idempotent worker route

The private worker handler should:

1. Accept only `POST /internal/tasks/live-runs`.
2. Rely on Cloud Run IAM authentication; do not expose the worker publicly.
3. Validate `runId` and load the run from Firestore.
4. Claim the run with a Firestore transaction that increments and returns `leaseGeneration`.
5. Return success immediately if the run is already completed.
6. Return retryable `503` without starting work when another worker owns an unexpired lease; do not acknowledge an unfinished run with `2xx`.
7. Execute the existing OpenAI → Daytona → Playwright pipeline.
8. Renew the lease with a heartbeat and persist every stage and bounded event to Firestore.
9. Upload large artifacts to Cloud Storage.
10. Mark terminal success or failure before returning.

Cloud Tasks is at-least-once delivery. Correctness must come from the Firestore claim/lease transaction, not from assuming each task runs once.

Use a 90-second lease renewed every 30 seconds. Every heartbeat, stage update, terminal write, and artifact pointer update must transactionally require both the claimed `leaseOwner` and `leaseGeneration`. If renewal fails, the stale worker must abort provider/browser work and must not write completion. The fencing token prevents a delayed original worker from overwriting a retry that acquired a newer lease. Make provider operations idempotent where their APIs support an idempotency key derived from the run ID.

The application's 1,620-second budget must include a final cleanup window. Abort provider calls and browser work before that budget expires, persist a retryable failure while the lease is still owned, and let Cloud Tasks decide whether another attempt remains.

Classify failures:

- Return `2xx` for permanent input/configuration failures after recording `failed`; retrying cannot repair them.
- Return `5xx` for transient OpenAI, Daytona, networking, or infrastructure failures while attempts remain.
- Read `X-CloudTasks-TaskRetryCount` to record the attempt and stop retry loops cleanly.
- Redact provider errors before storing or returning them.

### 8.4 Replace process-local subscriptions

For the first production version, keep the existing 1.5-second client polling against `GET /api/live-runs/[id]`. That route reads Firestore and omits:

- `prompt`
- `previewTarget`
- lease fields
- internal errors
- object-storage internals

Either remove the process-local SSE dependency or reimplement `/events` as a Firestore-backed stream. Polling is simpler and reliable for the expected traffic.

### 8.5 Migrate artifact and preview retrieval

Store the signed Daytona preview target in Firestore as a server-only field. `/api/live-runs/[id]/preview` should:

- Load the run from Firestore.
- Apply the existing allowed-host and redirect protections.
- Proxy only the stored target while it remains valid.
- Never return the raw signed target in run JSON.

Signed Daytona previews and their sandboxes are temporary. Define the UI contract explicitly: the interactive preview is best-effort during and shortly after a run; the scorecard, screenshots, evaluation JSON, and supported replay/static artifact remain available for the seven-day run-retention period. Display an “Interactive preview expired” fallback rather than a generic failure after the signed target expires.

Before the sandbox's auto-stop/archive/delete policy takes effect, the worker must upload screenshots, evaluation JSON, and any supported replay/static artifact to Cloud Storage. It writes only bounded object metadata—object name, content type, compressed size, and checksum—to Firestore.

Refactor `/api/live-runs/[id]/artifact` to load the object through the web service account, enforce the existing run/object prefix and response-size limits, and stream or decode the supported artifact format. It must no longer read `artifactWorkspace` from process memory. Completed scorecards must remain useful after the live preview expires; do not treat the signed Daytona URL as durable storage.

### 8.6 Make runtime mode explicit

Add an environment contract similar to:

```text
PROMPTGOLF_RUNTIME=gcp
GOOGLE_CLOUD_PROJECT
PROMPTGOLF_GCP_REGION=asia-southeast1
PROMPTGOLF_TASK_QUEUE=promptgolf-live-runs
PROMPTGOLF_WORKER_URL
PROMPTGOLF_TASK_INVOKER_SERVICE_ACCOUNT
PROMPTGOLF_ARTIFACT_BUCKET
PROMPTGOLF_RUN_BUDGET_SECONDS=1620
PROMPTGOLF_SUBMISSIONS_ENABLED=0 | 1
SERVICE_ROLE=web | worker
OPENAI_API_KEY                 worker only, from Secret Manager
DAYTONA_API_KEY                worker only, from Secret Manager
```

The web service must return `404` for worker-only routes. The worker service should not be used as the public site.

Do not inject OpenAI or Daytona keys into the web service merely to keep the provider-status UI green. Change that UI/API to derive availability from non-secret deployment metadata and recent worker health; per-run provider probes remain part of the durable run document.

### 8.7 Expected repository changes

Keep the migration scoped and reviewable. A practical file plan is:

```text
src/lib/promptgolf/live-run-repository.ts             shared interface
src/lib/promptgolf/live-run-repository-memory.ts      tests and explicit stub mode
src/lib/promptgolf/live-run-repository-firestore.ts   production state
src/lib/promptgolf/cloud-tasks.ts                     enqueue one run ID
src/lib/promptgolf/gcp-artifacts.ts                    private object storage
src/lib/promptgolf/live-runner.ts                      worker-executed pipeline with injected repository
src/app/api/live-runs/route.ts                         validate, persist, enqueue
src/app/api/live-runs/[id]/route.ts                    safe Firestore projection
src/app/api/live-runs/[id]/events/route.ts             remove or make Firestore-backed
src/app/api/live-runs/[id]/artifact/route.ts           stream durable Cloud Storage artifact
src/app/api/live-runs/[id]/preview/route.ts            Firestore-backed target lookup
src/app/internal/tasks/live-runs/route.ts              private idempotent worker handler
src/components/promptgolf/live-run-view.tsx            durable polling behavior
Dockerfile
.dockerignore
cloudbuild.yaml
```

Add unit tests for repository transactions, task deduplication, lease ownership, retry classification, safe projections, and worker-route role guards. Keep provider stubs at the OpenAI/Daytona boundary rather than replacing Firestore or Cloud Tasks semantics in integration tests.

## 9. Containerize PromptGolf

Use one pinned image for both Cloud Run services initially. `SERVICE_ROLE` determines which internal operations are available. This avoids web/worker version drift during the first migration.

Add `output: "standalone"` to `next.config.ts`, move the Playwright runtime package into production dependencies, and pin the Playwright image and npm package to the same version.

A suitable Dockerfile shape is:

```dockerfile
FROM node:24-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM mcr.microsoft.com/playwright:v1.60.0-noble AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["node", "server.js"]
```

Important:

- Keep the Playwright package version aligned with the base image version.
- Run the worker's browser smoke test inside the built image.
- Do not copy `.env`, credentials, local `.next`, or test evidence into the image.
- Add a `.dockerignore` covering `.git`, `.env*`, `.next`, `node_modules`, `test-results`, and local evidence not required at runtime.
- Pin production base images by digest once the first verified deployment works.

## 10. Build and push the image

Create Artifact Registry:

```bash
gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION" \
  --description="PromptGolf container images"
```

Grant the active Cloud Build service account permission to push into this repository:

```bash
export BUILD_SA="$(gcloud builds get-default-service-account)"

gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --location="$REGION" \
  --member="serviceAccount:${BUILD_SA}" \
  --role="roles/artifactregistry.writer"
```

Build and push with Cloud Build:

```bash
export IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
gcloud builds submit --tag "${IMAGE}:${IMAGE_TAG}" .
```

Do not deploy `latest`. Deploy the immutable commit tag or image digest.

## 11. Deploy the private worker

Pin enabled Secret Manager version numbers. The commands in §6 create version `1`; change these values after an intentional rotation:

```bash
export OPENAI_SECRET_VERSION="1"
export DAYTONA_SECRET_VERSION="1"
```

```bash
gcloud run deploy "$WORKER_SERVICE" \
  --image="${IMAGE}:${IMAGE_TAG}" \
  --region="$REGION" \
  --platform=managed \
  --no-allow-unauthenticated \
  --service-account="$WORKER_SA" \
  --cpu=2 \
  --memory=4Gi \
  --concurrency=1 \
  --min-instances=0 \
  --max-instances=3 \
  --timeout=1800 \
  --set-env-vars="SERVICE_ROLE=worker,PROMPTGOLF_RUNTIME=gcp,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},PROMPTGOLF_GCP_REGION=${REGION},PROMPTGOLF_ARTIFACT_BUCKET=${BUCKET},PROMPTGOLF_RUN_BUDGET_SECONDS=1620" \
  --set-secrets="OPENAI_API_KEY=openai-api-key:${OPENAI_SECRET_VERSION},DAYTONA_API_KEY=daytona-api-key:${DAYTONA_SECRET_VERSION}"
```

Capture the canonical worker URL:

```bash
export WORKER_URL="$(gcloud run services describe "$WORKER_SERVICE" \
  --region="$REGION" \
  --format='value(status.url)')"

printf '%s\n' "$WORKER_URL"
```

Allow only the task invoker service account to call it:

```bash
gcloud run services add-iam-policy-binding "$WORKER_SERVICE" \
  --region="$REGION" \
  --member="serviceAccount:${TASK_INVOKER_SA}" \
  --role="roles/run.invoker"
```

Do not use `--allow-unauthenticated` on the worker.

## 12. Deploy the public web service

```bash
gcloud run deploy "$WEB_SERVICE" \
  --image="${IMAGE}:${IMAGE_TAG}" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --service-account="$WEB_SA" \
  --cpu=1 \
  --memory=1Gi \
  --concurrency=40 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="SERVICE_ROLE=web,PROMPTGOLF_RUNTIME=gcp,GOOGLE_CLOUD_PROJECT=${PROJECT_ID},PROMPTGOLF_GCP_REGION=${REGION},PROMPTGOLF_TASK_QUEUE=${QUEUE},PROMPTGOLF_WORKER_URL=${WORKER_URL},PROMPTGOLF_TASK_INVOKER_SERVICE_ACCOUNT=${TASK_INVOKER_SA},PROMPTGOLF_ARTIFACT_BUCKET=${BUCKET},PROMPTGOLF_SUBMISSIONS_ENABLED=0"
```

The first production web revision intentionally disables live submissions. Keep it disabled until the load balancer, Cloud Armor policy, distributed quota, logs, and rollback path are verified. Disabled submissions must return a structured `503` before creating Firestore state or Cloud Tasks.

Capture its temporary URL:

```bash
export WEB_URL="$(gcloud run services describe "$WEB_SERVICE" \
  --region="$REGION" \
  --format='value(status.url)')"

printf '%s\n' "$WEB_URL"
```

## 13. Verify staging before DNS

### Infrastructure checks

```bash
gcloud run services describe "$WEB_SERVICE" --region="$REGION"
gcloud run services describe "$WORKER_SERVICE" --region="$REGION"
gcloud tasks queues describe "$QUEUE" --location="$REGION"
gcloud firestore databases describe --database='(default)'
gcloud storage buckets describe "gs://${BUCKET}"
```

Verify that anonymous access to the worker is rejected:

```bash
curl -i "${WORKER_URL}/internal/tasks/live-runs"
```

Expected result: `401` or `403`, not application output.

### Public endpoint checks

```bash
curl -fsS "${WEB_URL}/challenges/mini-checkout-promo-engine" >/dev/null

curl -i -X POST "${WEB_URL}/api/live-runs" \
  -H "Origin: ${WEB_URL}" \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'Content-Type: application/json' \
  --data '{"prompt":"short","challengeSlug":"mini-checkout-promo-engine"}'
```

Expected result for the second request: structured JSON `400`, proving the route loaded and validation ran. It must not return an HTML `500` page.

### Stubbed end-to-end run

Use a separate GCP staging project with its own Firestore database, queue, bucket, web service, worker service, and service accounts. Deploy the staging worker with `PROMPTGOLF_TEST_PROVIDER_STUBS=1` and without mounting real provider secrets. Never use a revision of the production worker for stub testing: a revision can receive production traffic unless traffic and task targeting are isolated perfectly.

Repeat the provisioning sections with a staging project ID, then point the staging web service only at the staging queue and worker URL. The staging task invoker must have no permission to invoke the production worker, and the production web service must have no permission to enqueue into the staging queue.

Verify:

1. Submission returns `202` and a run ID.
2. A Firestore document appears as `queued`.
3. Cloud Tasks dispatches one authenticated task.
4. The worker claims the run and progresses through stages.
5. The live page survives web/worker restarts because state is durable.
6. Polling returns safe run state without the prompt or signed preview target.
7. The generated preview proxy and results render.
8. A repeated task delivery does not execute the run twice.
9. Failed runs store a bounded, redacted error.
10. The worker writes artifacts to the expected bucket prefix.

Do not run a real provider submission at this stage. The first approved real run occurs only after production traffic is behind the load balancer, shared quota and Cloud Armor are enforced, and the submission kill switch is deliberately enabled in §14.

### Logs

```bash
gcloud run services logs read "$WEB_SERVICE" \
  --region="$REGION" \
  --limit=100

gcloud run services logs read "$WORKER_SERVICE" \
  --region="$REGION" \
  --limit=200
```

Search for secrets, raw authorization headers, signed preview URLs, and unbounded provider bodies before cutover. None should appear.

## 14. Configure the custom domain

Google recommends a global external Application Load Balancer for Cloud Run custom domains. It provides managed TLS, a stable global IP, optional Cloud CDN, and room for security policies. Use it for the final production setup.

In **Network Services → Load balancing**, create a public global Application Load Balancer with:

1. A global Premium-tier static IPv4 address.
2. A serverless network endpoint group in `asia-southeast1` targeting `promptgolf-web`.
3. A global backend service using that serverless NEG.
4. A URL map whose default backend is the PromptGolf backend service.
5. A Google-managed certificate covering `www.promptgolf.dev` and, if served directly, `promptgolf.dev`.
6. An HTTPS frontend on port 443 and an HTTP-to-HTTPS redirect on port 80.
7. Backend logging enabled and an enforced Cloud Armor throttle for `POST /api/live-runs`, tested in preview first.

Record the reserved load-balancer IP. Keep the worker on its generated `run.app` URL with IAM authentication because Cloud Tasks uses that URL as its OIDC audience.

Production cutover sequence:

1. Lower the existing DNS TTL to 300 seconds at least several hours beforehand.
2. Verify the web and worker `run.app` URLs, Firestore persistence, task authentication, shared quota, and artifact retrieval.
3. Confirm the load balancer, serverless NEG, certificate resource, HTTPS frontend, redirect, logging, and Cloud Armor policy are configured.
4. Point `www.promptgolf.dev` to the reserved load-balancer IP and keep the apex redirecting to `www`.
5. Wait for the Google-managed certificate to become active.
6. Re-run the production smoke checks through `https://www.promptgolf.dev`.
7. After load-balanced traffic and enforced controls are healthy, enable submissions and prevent bypass through the public web `run.app` URL:

```bash
gcloud run services update "$WEB_SERVICE" \
  --region="$REGION" \
  --update-env-vars="PROMPTGOLF_SUBMISSIONS_ENABLED=1" \
  --ingress=internal-and-cloud-load-balancing
```

Immediately submit one explicitly approved low-cost real run through `https://www.promptgolf.dev`, confirm Firestore/task/worker/artifact behavior, and pause the queue or disable submissions if any stage fails.

8. Keep the Vercel deployment and previous DNS values available for at least 24–48 hours as rollback capacity. Do not delete the Vercel project immediately after DNS changes.

### Optional staging-only shortcut

Cloud Run domain mapping is available in `asia-southeast1`, but Google documents it as Preview and not production-ready. Use it only for a temporary staging hostname when an external load balancer is not ready:

```bash
gcloud beta run domain-mappings create \
  --service="$WEB_SERVICE" \
  --domain="staging.promptgolf.dev" \
  --region="$REGION"

gcloud beta run domain-mappings describe \
  --domain="staging.promptgolf.dev" \
  --region="$REGION"
```

Do not use this Preview mapping as the production `www.promptgolf.dev` cutover path.

## 15. CI/CD after the first manual deployment

Make the first deployment manually so every identity and resource is observable. Then connect GitHub to Cloud Build and add a trigger for `main`.

The pipeline should:

1. Run `npm test`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Build one pinned container image.
5. Run a Chromium smoke test inside that image.
6. Push the commit-tagged image to Artifact Registry.
7. Deploy the worker first.
8. Run the authenticated worker health check.
9. Deploy the web service with the same image digest.
10. Run deployed JSON endpoint smoke tests.
11. Shift traffic only after checks pass.

Use Cloud Build's service account or Workload Identity Federation. Do not add a downloadable GCP service-account key to GitHub Secrets.

## 16. Monitoring and operational controls

Create alerts for:

- Worker `5xx` responses.
- Cloud Tasks oldest-task age and queue depth.
- Runs stuck in `queued` or `running` beyond the lease/deadline.
- Cloud Run container crashes and memory exhaustion.
- Firestore permission failures.
- OpenAI or Daytona failure rates.
- Unexpected Artifact Registry, Cloud Storage, or Cloud Run spend.

Recommended initial limits:

| Setting | Initial value |
| --- | --- |
| Queue dispatch rate | 1 per second |
| Queue concurrent dispatches | 2 |
| Worker concurrency | 1 |
| Worker max instances | 3 |
| Worker CPU / memory | 2 vCPU / 4 GiB |
| Worker timeout | 1,800 seconds |
| Task dispatch deadline | 1,740 seconds |
| Application execution budget | 1,620 seconds |
| Max task attempts | 3 |
| Live-run retention | 7 days |
| Events per run | 200 |

Tune these only from observed run duration, memory, queue age, and provider limits.

## 17. Rollback

List revisions:

```bash
gcloud run revisions list \
  --service="$WEB_SERVICE" \
  --region="$REGION"

gcloud run revisions list \
  --service="$WORKER_SERVICE" \
  --region="$REGION"
```

Route traffic back to a known-good revision:

```bash
gcloud run services update-traffic "$WEB_SERVICE" \
  --region="$REGION" \
  --to-revisions="KNOWN_GOOD_WEB_REVISION=100"

gcloud run services update-traffic "$WORKER_SERVICE" \
  --region="$REGION" \
  --to-revisions="KNOWN_GOOD_WORKER_REVISION=100"
```

If the Cloud Run web path is unhealthy during cutover, restore the previous Vercel DNS record while investigating. Firestore run documents and Cloud Storage artifacts remain available for diagnosis.

Pause task dispatch during a worker incident:

```bash
gcloud tasks queues pause "$QUEUE" --location="$REGION"
```

Resume after the worker is healthy:

```bash
gcloud tasks queues resume "$QUEUE" --location="$REGION"
```

## Production readiness checklist

- [ ] Process-local run storage replaced with Firestore.
- [ ] Process-local scheduler replaced with Cloud Tasks.
- [ ] Worker claims use lease heartbeats and fencing tokens on every write.
- [ ] Web and worker service accounts have separate least-privilege roles.
- [ ] Worker is private and accepts authenticated task invocations only.
- [ ] OpenAI and Daytona keys exist only in Secret Manager and worker environment.
- [ ] Chromium launches inside the final container image.
- [ ] Large artifacts are stored in private Cloud Storage.
- [ ] Artifact routes read Cloud Storage and expired live previews have a durable fallback.
- [ ] Shared Firestore quota and enforced Cloud Armor submission throttling are active.
- [ ] Secret versions are pinned rather than deployed from `latest`.
- [ ] Stub verification uses a separate staging project, queue, and worker.
- [ ] Prompt and signed preview target never appear in public run JSON.
- [ ] Stubbed end-to-end run survives service restarts.
- [ ] One approved real provider run completes.
- [ ] Logs contain no credentials, prompts, authorization headers, or signed preview URLs.
- [ ] Alerts and a billing budget are configured.
- [ ] Rollback revision and old Vercel DNS values are recorded.
- [ ] Production traffic uses the external load balancer, not Preview domain mapping.
- [ ] Production domain passes submission, polling, preview, and mobile checks.

## Official references

- Cloud Run request timeouts: <https://cloud.google.com/run/docs/configuring/request-timeout>
- Cloud Run service authentication: <https://cloud.google.com/run/docs/authenticating/service-to-service>
- Cloud Run custom domains: <https://cloud.google.com/run/docs/mapping-custom-domains>
- External Application Load Balancer with Cloud Run: <https://cloud.google.com/load-balancing/docs/https/setting-up-https-serverless>
- Cloud Tasks HTTP targets: <https://cloud.google.com/tasks/docs/creating-http-target-tasks>
- Cloud Tasks queue configuration: <https://cloud.google.com/tasks/docs/configuring-queues>
- Cloud Tasks queue-level IAM: <https://cloud.google.com/tasks/docs/secure-queue-configuration>
- Cloud Armor rate limiting: <https://cloud.google.com/armor/docs/rate-limiting-overview>
- Firestore database creation: <https://cloud.google.com/sdk/gcloud/reference/firestore/databases/create>
- Firestore TTL: <https://cloud.google.com/firestore/docs/ttl>
- Artifact Registry Docker images: <https://cloud.google.com/artifact-registry/docs/docker/store-docker-container-images>
- Cloud Run secrets: <https://cloud.google.com/run/docs/configuring/services/secrets>
- Cloud Build GitHub connection: <https://cloud.google.com/build/docs/automating-builds/github/connect-repo-github>
