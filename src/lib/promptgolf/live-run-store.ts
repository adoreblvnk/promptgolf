import type { ProviderProbe } from "./adapters";

export type LiveRunStatus = "queued" | "running" | "completed" | "failed";
export type LiveRunStage = "queued" | "generate" | "sandbox" | "test" | "score" | "completed" | "failed";

export type LiveRunEvent = {
  id: number;
  at: string;
  stage: LiveRunStage;
  level: "info" | "success" | "warning" | "error";
  message: string;
};

export type LiveRunTestResult = {
  id: string;
  label: string;
  category: "public" | "hidden" | "ux";
  passed: boolean;
  note: string;
};

export type LiveRun = {
  id: string;
  challengeSlug: string;
  prompt: string;
  status: LiveRunStatus;
  stage: LiveRunStage;
  createdAt: string;
  updatedAt: string;
  providerMode: string;
  sandboxMode: string;
  previewUrl?: string;
  previewLabel?: string;
  artifactHtml?: string;
  tests: LiveRunTestResult[];
  score?: {
    passed: number;
    total: number;
    finalScore: number;
  };
  providerState: ProviderProbe[];
  events: LiveRunEvent[];
  error?: string;
};

type Subscriber = (event: LiveRunEvent) => void;

const globalKey = "__promptgolf_live_runs__";

type LiveRunStore = {
  runs: Map<string, LiveRun>;
  subscribers: Map<string, Set<Subscriber>>;
};

function getStore(): LiveRunStore {
  const globalObject = globalThis as typeof globalThis & { [globalKey]?: LiveRunStore };
  globalObject[globalKey] ??= { runs: new Map(), subscribers: new Map() };
  return globalObject[globalKey];
}

export function createLiveRun(input: { prompt: string; challengeSlug: string }) {
  const id = `live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const run: LiveRun = {
    id,
    challengeSlug: input.challengeSlug,
    prompt: input.prompt,
    status: "queued",
    stage: "queued",
    createdAt: now,
    updatedAt: now,
    providerMode: "pending",
    sandboxMode: "pending",
    tests: [],
    providerState: [],
    events: [],
  };
  getStore().runs.set(id, run);
  appendLiveRunEvent(id, "queued", "info", "Live run created. Generation is queued on the server.");
  return run;
}

export function getLiveRun(id: string) {
  return getStore().runs.get(id);
}

export function updateLiveRun(id: string, patch: Partial<Omit<LiveRun, "id" | "events">>) {
  const run = getLiveRun(id);
  if (!run) return undefined;
  Object.assign(run, patch, { updatedAt: new Date().toISOString() });
  return run;
}

export function appendLiveRunEvent(id: string, stage: LiveRunStage, level: LiveRunEvent["level"], message: string) {
  const run = getLiveRun(id);
  if (!run) return undefined;
  const event: LiveRunEvent = {
    id: run.events.length + 1,
    at: new Date().toISOString(),
    stage,
    level,
    message: sanitizeLog(message),
  };
  run.events.push(event);
  run.stage = stage;
  run.updatedAt = event.at;
  getStore().subscribers.get(id)?.forEach((subscriber) => subscriber(event));
  return event;
}

export function subscribeToLiveRun(id: string, subscriber: Subscriber) {
  const store = getStore();
  const set = store.subscribers.get(id) ?? new Set<Subscriber>();
  set.add(subscriber);
  store.subscribers.set(id, set);
  return () => {
    set.delete(subscriber);
    if (set.size === 0) store.subscribers.delete(id);
  };
}

export function sanitizeLog(input: string) {
  return input
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/gi, "[redacted-key]")
    .replace(/(MOONSHOT_API_KEY|TOKENROUTER_API_KEY|DAYTONA_API_KEY)=\S+/gi, "$1=[redacted]")
    .slice(0, 1000);
}

// Demo note: this store is intentionally process-local and non-persistent.
// It keeps the live demo simple; production should move runs/events/artifacts to a durable DB/blob store.
