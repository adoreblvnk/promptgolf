import path from "node:path";
import { generateObject, generateText, hasToolCall, stepCountIs, tool } from "ai";
import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { z } from "zod";
import { getOpenAIAdapterStatus, getStoredEvalSpecStatus, probeDaytonaStatus } from "./adapters";
import { adaptWorkspace } from "./artifact-adapter";
import { boundedEnvNumber } from "./env-number";
import { checkoutEvaluatorSpecs } from "./evaluator-specs";
import { deterministicCheckoutWorkspace } from "./live-run-fixture";
import { appendLiveRunEvent, createLiveRun, deleteLiveRun, getLiveRun, sanitizeLog, updateLiveRun, type LiveRunCategoryScore, type LiveRunSkillDiagnosis, type LiveRunTestCategory, type LiveRunTestResult } from "./live-run-store";
import { OPENAI_BUILDER_MODEL, OPENAI_DIAGNOSIS_MODEL, OPENAI_VISUAL_JUDGE_MODEL } from "./model";
import { captureVisualEvidence, evaluateSpecsWithPlaywright } from "./playwright-evaluator";
import { readBoundedResponseText } from "./provider-response";
import { redactSecrets } from "./redact-secrets";
import { RunScheduler } from "./run-scheduler";
import { parseWorkspace, workspaceSummary, type WorkspaceManifest } from "./workspace";

const BUILDER_STEP_LIMIT = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_STEP_LIMIT, 24, { min: 20, max: 25, integer: true });
const BUILDER_WALL_CLOCK_MS = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_WALL_CLOCK_MS, 540_000, { min: 120_000, max: 900_000, integer: true });
const BUILDER_MAX_OUTPUT_TOKENS = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_MAX_OUTPUT_TOKENS, 12_000, { min: 2_048, max: 20_000, integer: true });
const BUILDER_FILE_BYTES = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_FILE_BYTES, 256 * 1024, { min: 16 * 1024, max: 512 * 1024, integer: true });
const BUILDER_WORKSPACE_BYTES = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_WORKSPACE_BYTES, 2 * 1024 * 1024, { min: 256 * 1024, max: 4 * 1024 * 1024, integer: true });
const BUILDER_MAX_FILES = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_MAX_FILES, 160, { min: 16, max: 220, integer: true });
const BUILDER_COMMAND_OUTPUT_CHARS = boundedEnvNumber(process.env.PROMPTGOLF_BUILDER_COMMAND_OUTPUT_CHARS, 12_000, { min: 1_000, max: 24_000, integer: true });
const BUILDER_TIMEOUT_SECONDS = boundedEnvNumber(process.env.PROMPTGOLF_DAYTONA_CREATE_TIMEOUT_SECONDS, 45, { min: 5, max: 180, integer: true });
const EVALUATION_TIMEOUT_MS = boundedEnvNumber(process.env.PROMPTGOLF_LIVE_EVALUATION_TIMEOUT_MS, 45_000, { min: 5_000, max: 180_000, integer: true });
const EVALUATION_MAX_OUTPUT_TOKENS = boundedEnvNumber(process.env.PROMPTGOLF_LIVE_EVALUATION_MAX_OUTPUT_TOKENS, 900, { min: 128, max: 8_192, integer: true });
const PREVIEW_PROBE_TIMEOUT_MS = 5_000;
const MAX_PREVIEW_PROBE_BYTES = 512 * 1024;
const BUILDER_PORT = 3000;
const REMOTE_PROJECT_DIR = "promptgolf-live";
const configuredConcurrency = boundedEnvNumber(process.env.PROMPTGOLF_LIVE_RUN_CONCURRENCY, 2, { min: 1, max: 8, integer: true });
const configuredQueueCapacity = boundedEnvNumber(process.env.PROMPTGOLF_LIVE_RUN_QUEUE_CAPACITY, 20, { min: 0, max: 100, integer: true });
const liveRunScheduler = new RunScheduler(configuredConcurrency, configuredQueueCapacity);

const CATEGORY_LABELS: Record<LiveRunTestCategory, string> = {
  functional: "Functional",
  hidden: "Hidden",
  style: "UI/UX",
};

const STYLE_TESTS: Array<Pick<LiveRunTestResult, "id" | "label" | "category">> = [
  { id: "style-visual-hierarchy", label: "Checkout visual hierarchy and clarity", category: "style" },
  { id: "style-mobile-usability", label: "Mobile UI/UX and touch ergonomics", category: "style" },
];

const SkillDiagnosisSchema = z.object({
  verdict: z.enum(["prompting", "technical", "balanced"]),
  promptingScore: z.number().int().min(0).max(10),
  technicalScore: z.number().int().min(0).max(10),
  summary: z.string().min(1).max(220),
  promptingFeedback: z.string().min(1).max(180),
  technicalFeedback: z.string().min(1).max(180),
});

const VisualJudgeSchema = z.object({
  styleTests: z.array(z.object({
    id: z.enum(["style-visual-hierarchy", "style-mobile-usability"]),
    label: z.string().min(1).max(120),
    passed: z.boolean(),
    note: z.string().min(1).max(300),
  })).length(2),
});

const FinalizeSchema = z.object({
  framework: z.string().min(1).max(80),
  language: z.string().min(1).max(40),
  packageManager: z.enum(["npm", "pnpm", "yarn", "bun"]),
  manifestPath: z.string().min(1).max(160),
  buildCommand: z.string().min(1).max(200),
  startCommand: z.string().min(1).max(200),
  healthPath: z.string().min(1).max(120),
  previewPath: z.string().min(1).max(120),
  summary: z.string().min(1).max(240),
});

type BuilderFinalization = z.infer<typeof FinalizeSchema>;

type DaytonaCommandResponse = {
  cmdId?: string;
  output?: string;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
};

type DaytonaSandboxLike = {
  id?: string;
  fs: {
    downloadFile(remotePath: string, timeout?: number): Promise<Buffer>;
    listFiles(path: string): Promise<unknown[]>;
    uploadFile(file: Buffer, remotePath: string, timeout?: number): Promise<void>;
  };
  process: {
    createSession(sessionId: string): Promise<void>;
    executeSessionCommand(sessionId: string, req: { command: string; runAsync?: boolean; suppressInputEcho?: boolean }, timeout?: number): Promise<DaytonaCommandResponse>;
    getSessionCommandLogs?: (sessionId: string, commandId: string) => Promise<{ output?: string; stdout?: string; stderr?: string }>;
  };
  getPreviewLink?(port: number): Promise<unknown>;
  getSignedPreviewUrl?(port: number, expiresInSeconds?: number): Promise<unknown>;
  getWorkDir?(): Promise<string | undefined>;
  waitUntilStarted?(timeout?: number): Promise<void>;
  delete?(timeout?: number): Promise<void>;
};

function stubsEnabled() {
  return process.env.PROMPTGOLF_TEST_PROVIDER_STUBS === "1";
}

function absoluteOrigin(origin?: string) {
  return origin?.replace(/\/$/, "") || `http://127.0.0.1:${process.env.PORT || 3000}`;
}

function clip(input: string, maxLength = BUILDER_COMMAND_OUTPUT_CHARS) {
  const sanitized = redactSecrets(input, maxLength + 1);
  return sanitized.length > maxLength ? `${sanitized.slice(0, maxLength - 1)}…` : sanitized;
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

const SAFE_PATH_SEGMENT = /^[A-Za-z0-9._@()+[\]-]+$/;

function normalizeRelativePath(value: string) {
  const trimmed = value.trim().replace(/^\.\//, "");
  const normalized = path.posix.normalize(trimmed);
  const segments = normalized.split("/");
  const invalid =
    !trimmed ||
    normalized === "." ||
    normalized.startsWith("/") ||
    normalized.includes("\\") ||
    normalized.includes("\0") ||
    /^[a-z]:/i.test(normalized) ||
    segments.some((segment) => segment === "" || segment === "." || segment === ".." || !SAFE_PATH_SEGMENT.test(segment));
  if (invalid) throw new Error("Workspace paths must be normalized relative paths without traversal, spaces, quotes, or shell metacharacters.");
  return normalized;
}

function normalizeRelativeDirectory(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "." || trimmed === "./") return ".";
  return normalizeRelativePath(trimmed);
}

function validateRoutePath(value: string) {
  if (!/^\/(?:[A-Za-z0-9._~!$&()*+,;=:@/-]|%[0-9A-Fa-f]{2})*$/.test(value)) {
    throw new Error("Routes must be URL-safe absolute paths without query strings, fragments, quotes, or whitespace.");
  }
  return value;
}

function previewUrlFrom(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "url" in value) return String(value.url);
  return undefined;
}

function commandOutput(response: DaytonaCommandResponse) {
  return [response.stdout, response.stderr, response.output].filter(Boolean).join("\n").trim();
}

function isSuccessExit(exitCode: unknown) {
  return exitCode === undefined || exitCode === 0;
}

export async function probePreview(
  url: string,
  fetcher: typeof fetch = fetch,
): Promise<{ ready: boolean; observation: string }> {
  try {
    const response = await fetcher(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(PREVIEW_PROBE_TIMEOUT_MS),
    });
    const body = await readBoundedResponseText(response, MAX_PREVIEW_PROBE_BYTES);
    if (response.ok && /<!doctype html>|<html[\s>]/i.test(body)) {
      return { ready: true, observation: "HTML preview is ready" };
    }
    const bodyPreview = body.replace(/\s+/g, " ").slice(0, 160);
    return { ready: false, observation: `HTTP ${response.status}; body: ${bodyPreview || "empty"}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ready: false, observation: `preview probe failed: ${sanitizeLog(message)}` };
  }
}

async function waitForPreviewReady(id: string, url: string) {
  appendLiveRunEvent(id, "sandbox", "info", "Waiting for the Daytona preview route to serve HTML before evaluation starts.");
  let lastObservation = "no response received";
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const probe = await probePreview(url);
    if (probe.ready) return;
    lastObservation = probe.observation;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Daytona preview did not serve HTML before the evaluation timeout (${sanitizeLog(lastObservation)})`);
}

function classifyApprovedCommand(command: string) {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (/^(npm install|npm ci)(?:\s+--[A-Za-z0-9=-]+)*$/.test(normalized)) return { kind: "install" as const, command: normalized, timeout: 180 };
  if (/^(npm run build|npx next build)$/.test(normalized)) return { kind: "build" as const, command: normalized, timeout: 240 };
  if (/^(npm run typecheck|npm run lint|npx tsc --noEmit)$/.test(normalized)) return { kind: "typecheck" as const, command: normalized, timeout: 150 };
  if (/^(npm test|npm run test)(?:\s+--\s+[A-Za-z0-9_ ./:=@-]+)?$/.test(normalized)) return { kind: "test" as const, command: normalized, timeout: 150 };
  return undefined;
}

function validateStartCommand(command: string) {
  const normalized = command.trim().replace(/\s+/g, " ");
  if (/^(npm start|npm run start|npm run preview(?: -- --host 0\.0\.0\.0)?|npx next start(?: -H 0\.0\.0\.0)?)$/.test(normalized)) return normalized;
  throw new Error("Start command must be one of: npm start, npm run start, npm run preview -- --host 0.0.0.0, or npx next start -H 0.0.0.0.");
}

async function runLocalHttpProbe(input: {
  sandbox: DaytonaSandboxLike;
  sessionId: string;
  port: number;
  routePath: string;
  expectHtml: boolean;
}) {
  const url = `http://127.0.0.1:${input.port}${input.routePath}`;
  const command = `node <<'NODE'
const url = ${JSON.stringify(url)};
const expectHtml = ${input.expectHtml ? "true" : "false"};
const started = Date.now();
let last = "no response";
while (Date.now() - started < 15000) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    const text = await response.text();
    const html = /<!doctype html>|<html[\\s>]/i.test(text);
    if (response.status === 200 && (!expectHtml || html)) {
      console.log(JSON.stringify({ ok: true, status: response.status, bytes: text.length }));
      process.exit(0);
    }
    last = "HTTP " + response.status + "; html=" + html + "; body=" + text.slice(0, 120).replace(/\s+/g, " ");
  } catch (error) {
    last = error instanceof Error ? error.message : String(error);
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}
console.error(JSON.stringify({ ok: false, last }));
process.exit(1);
NODE`;
  return input.sandbox.process.executeSessionCommand(input.sessionId, { command, suppressInputEcho: true }, 20);
}

function buildPromptForContestant(prompt: string) {
  return `Contestant prompt:\n${prompt.slice(0, 8000)}\n\nBuild the requested web application exactly from that contestant prompt. The public challenge brief is an ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation. Do not receive, infer, or ask for hidden EvalSpecs. If the contestant omitted a domain edge case, do not silently add a hidden-test-specific rule; build a competent implementation from the supplied spec. Use a framework-native multi-file project, defaulting to Next.js App Router + TypeScript when the prompt does not require another JavaScript framework.`;
}

async function snapshotWorkspace(input: {
  sandbox: DaytonaSandboxLike;
  remoteRoot: string;
  finalization: BuilderFinalization;
}): Promise<WorkspaceManifest> {
  const findCommand = `cd ${shellQuote(input.remoteRoot)} && find . -type f \
    ! -path './node_modules/*' \
    ! -path './.next/*' \
    ! -path './dist/*' \
    ! -path './build/*' \
    ! -path './coverage/*' \
    ! -name 'package-lock.json' \
    -size -${BUILDER_FILE_BYTES}c \
    | sed 's#^./##' | sort | head -n ${BUILDER_MAX_FILES + 1}`;
  const listed = await input.sandbox.process.executeSessionCommand("promptgolf-inspect", { command: findCommand, suppressInputEcho: true }, 15);
  if (!isSuccessExit(listed.exitCode)) throw new Error(`Could not snapshot workspace files: ${clip(commandOutput(listed), 500)}`);
  const paths = (listed.stdout ?? listed.output ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, BUILDER_MAX_FILES)
    .flatMap((line) => {
      try {
        return [normalizeRelativePath(line)];
      } catch {
        return [];
      }
    });
  if (!paths.includes(input.finalization.manifestPath)) paths.unshift(input.finalization.manifestPath);

  const files: WorkspaceManifest["files"] = [];
  let totalBytes = 0;
  for (const relativePath of [...new Set(paths)]) {
    const remotePath = `${input.remoteRoot}/${relativePath}`;
    const buffer = await input.sandbox.fs.downloadFile(remotePath, 20);
    if (buffer.byteLength > BUILDER_FILE_BYTES) continue;
    totalBytes += buffer.byteLength;
    if (totalBytes > BUILDER_WORKSPACE_BYTES) throw new Error("Generated workspace exceeded the snapshot byte limit.");
    files.push({ path: relativePath, content: buffer.toString("utf8") });
  }

  return parseWorkspace({
    schemaVersion: 1,
    framework: input.finalization.framework,
    language: input.finalization.language,
    packageManager: input.finalization.packageManager,
    files,
    commands: { install: "npm install", build: input.finalization.buildCommand, start: input.finalization.startCommand },
    runtime: { port: BUILDER_PORT, healthPath: input.finalization.healthPath },
    entrypoints: { preview: input.finalization.previewPath, manifest: input.finalization.manifestPath },
  });
}

async function buildInDaytona(id: string, prompt: string, origin: string) {
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const daytonaKey = process.env.DAYTONA_API_KEY?.trim();
  if (!openAIKey) throw new Error("OPENAI_API_KEY is not configured. Live runs use OpenAI AI SDK only and do not switch providers.");
  if (!daytonaKey) throw new Error("DAYTONA_API_KEY is not configured. Live runs require Daytona and do not use a local substitute.");

  const startedAt = Date.now();
  let sandbox: DaytonaSandboxLike | undefined;
  let remoteRoot = `/home/daytona/${REMOTE_PROJECT_DIR}-${id.replace(/[^A-Za-z0-9-]/g, "")}`;
  let finalization: BuilderFinalization | undefined;
  let buildSucceeded = false;
  let appStarted = false;
  let healthVerified = false;
  let previewVerified = false;
  let startCommandId: string | undefined;
  let lastBuildCommand = "npm run build";
  let lastStartCommand = "npm start";
  let lastHealthPath = "/health";
  let lastPreviewPath = "/";
  const fileSizes = new Map<string, number>();
  let workspaceBytes = 0;
  let lastDiagnostics = "No diagnostics have been collected yet.";

  function ensureWallClock() {
    if (Date.now() - startedAt > BUILDER_WALL_CLOCK_MS) {
      throw new Error(`Builder loop exceeded the ${Math.round(BUILDER_WALL_CLOCK_MS / 1000)}s wall-clock limit.`);
    }
  }

  function toRemote(relativePath: string) {
    return `${remoteRoot}/${relativePath}`;
  }

  async function executeWorkspaceCommand(command: string, timeout: number) {
    ensureWallClock();
    const response = await sandbox!.process.executeSessionCommand(
      "promptgolf-builder",
      { command: `cd ${shellQuote(remoteRoot)} && ${command}`, suppressInputEcho: true },
      timeout,
    );
    const output = clip(commandOutput(response));
    lastDiagnostics = output || `Command exited ${response.exitCode ?? 0} with no output.`;
    return { ...response, safeOutput: lastDiagnostics };
  }

  try {
    updateLiveRun(id, { providerMode: `OpenAI live · ${OPENAI_BUILDER_MODEL}`, sandboxMode: "Daytona creating sandbox" });
    appendLiveRunEvent(id, "generate", "info", `Starting OpenAI builder loop (${OPENAI_BUILDER_MODEL}, reasoning medium, verbosity low).`);
    appendLiveRunEvent(id, "sandbox", "info", "Creating isolated Daytona sandbox with auto-stop/archive/delete policy.");
    const { Daytona } = await import("@daytonaio/sdk");
    const daytona = new Daytona();
    sandbox = await daytona.create(
      {
        language: "typescript",
        autoStopInterval: 15,
        autoArchiveInterval: 30,
        autoDeleteInterval: 120,
        labels: { app: "promptgolf", run: id },
      },
      { timeout: BUILDER_TIMEOUT_SECONDS },
    );
    if (sandbox.waitUntilStarted) await sandbox.waitUntilStarted(BUILDER_TIMEOUT_SECONDS);
    const workDir = await sandbox.getWorkDir?.().catch(() => undefined);
    if (workDir?.startsWith("/")) remoteRoot = `${workDir.replace(/\/$/, "")}/${REMOTE_PROJECT_DIR}`;
    await sandbox.process.createSession("promptgolf-builder");
    await sandbox.process.createSession("promptgolf-server");
    await sandbox.process.createSession("promptgolf-inspect");
    await sandbox.process.executeSessionCommand("promptgolf-builder", { command: `rm -rf ${shellQuote(remoteRoot)} && mkdir -p ${shellQuote(remoteRoot)}`, suppressInputEcho: true }, 20);
    updateLiveRun(id, { sandboxMode: `Daytona sandbox ${sandbox.id ?? "created"}` });
    appendLiveRunEvent(id, "sandbox", "success", "Daytona sandbox created. Builder tools are scoped to its project directory.");

    const tools = {
      list_files: tool({
        description: "List files inside the generated project workspace. Paths are relative to the project root.",
        inputSchema: z.object({ directory: z.string().default(".") }),
        execute: async ({ directory }) => {
          try {
            ensureWallClock();
            const relativeDirectory = normalizeRelativeDirectory(directory);
            const remoteDirectory = relativeDirectory === "." ? remoteRoot : toRemote(relativeDirectory);
            const files = await sandbox!.fs.listFiles(remoteDirectory);
            return { ok: true, files: JSON.stringify(files).slice(0, 6000) };
          } catch (error) {
            return { ok: false, error: clip(error instanceof Error ? error.message : String(error), 1000) };
          }
        },
      }),
      read_file: tool({
        description: "Read one workspace file, bounded by the file-size limit. Paths are relative to the project root.",
        inputSchema: z.object({ path: z.string().min(1) }),
        execute: async ({ path: requestedPath }) => {
          try {
            ensureWallClock();
            const relativePath = normalizeRelativePath(requestedPath);
            const buffer = await sandbox!.fs.downloadFile(toRemote(relativePath), 20);
            if (buffer.byteLength > BUILDER_FILE_BYTES) throw new Error("File exceeds the readable byte limit.");
            return { ok: true, path: relativePath, content: buffer.toString("utf8") };
          } catch (error) {
            return { ok: false, error: clip(error instanceof Error ? error.message : String(error), 1000) };
          }
        },
      }),
      write_file: tool({
        description: "Create or replace one workspace file. Paths must be normalized relative paths. Writes are bounded by file and workspace byte limits.",
        inputSchema: z.object({ path: z.string().min(1), content: z.string() }),
        execute: async ({ path: requestedPath, content }) => {
          try {
            ensureWallClock();
            const relativePath = normalizeRelativePath(requestedPath);
            const size = Buffer.byteLength(content, "utf8");
            if (size > BUILDER_FILE_BYTES) throw new Error(`File exceeds ${BUILDER_FILE_BYTES} byte limit.`);
            const previousSize = fileSizes.get(relativePath) ?? 0;
            const nextWorkspaceBytes = workspaceBytes - previousSize + size;
            if (!fileSizes.has(relativePath) && fileSizes.size >= BUILDER_MAX_FILES) throw new Error(`Workspace exceeds ${BUILDER_MAX_FILES} file limit.`);
            if (nextWorkspaceBytes > BUILDER_WORKSPACE_BYTES) throw new Error(`Workspace exceeds ${BUILDER_WORKSPACE_BYTES} byte limit.`);
            await sandbox!.process.executeSessionCommand("promptgolf-builder", { command: `mkdir -p ${shellQuote(path.posix.dirname(toRemote(relativePath)))}`, suppressInputEcho: true }, 20);
            await sandbox!.fs.uploadFile(Buffer.from(content, "utf8"), toRemote(relativePath), 20);
            fileSizes.set(relativePath, size);
            workspaceBytes = nextWorkspaceBytes;
            return { ok: true, path: relativePath, bytes: size, files: fileSizes.size, workspaceBytes };
          } catch (error) {
            return { ok: false, error: clip(error instanceof Error ? error.message : String(error), 1000) };
          }
        },
      }),
      run_command: tool({
        description: "Run an approved install, build, typecheck, lint, or test command in the Daytona workspace and return bounded diagnostics.",
        inputSchema: z.object({ command: z.string().min(1).max(200) }),
        execute: async ({ command }) => {
          try {
            const approved = classifyApprovedCommand(command);
            if (!approved) throw new Error("Command is not approved. Allowed: npm install, npm ci, npm run build, npx next build, npm run typecheck, npx tsc --noEmit, npm run lint, npm test, npm run test.");
            appendLiveRunEvent(id, approved.kind === "build" ? "generate" : "sandbox", "info", `Builder running ${approved.kind} command: ${approved.command}`);
            const response = await executeWorkspaceCommand(approved.command, approved.timeout);
            if (approved.kind === "build") {
              buildSucceeded = isSuccessExit(response.exitCode);
              if (buildSucceeded) lastBuildCommand = approved.command;
            }
            appendLiveRunEvent(id, approved.kind === "build" ? "generate" : "sandbox", isSuccessExit(response.exitCode) ? "success" : "warning", `${approved.command} exited ${response.exitCode ?? 0}. ${clip(response.safeOutput, 500)}`);
            return { ok: isSuccessExit(response.exitCode), command: approved.command, exitCode: response.exitCode ?? 0, output: response.safeOutput };
          } catch (error) {
            const message = clip(error instanceof Error ? error.message : String(error), 1000);
            lastDiagnostics = message;
            return { ok: false, error: message };
          }
        },
      }),
      read_diagnostics: tool({
        description: "Read the latest bounded command diagnostics and server logs after a failed build, start, health, or preview probe.",
        inputSchema: z.object({}),
        execute: async () => {
          try {
            let serverLogs = "";
            if (startCommandId && sandbox?.process.getSessionCommandLogs) {
              const logs = await sandbox.process.getSessionCommandLogs("promptgolf-server", startCommandId).catch(() => undefined);
              serverLogs = clip([logs?.stdout, logs?.stderr, logs?.output].filter(Boolean).join("\n"), 4000);
            }
            return { ok: true, diagnostics: lastDiagnostics, serverLogs };
          } catch (error) {
            return { ok: false, error: clip(error instanceof Error ? error.message : String(error), 1000) };
          }
        },
      }),
      start_app: tool({
        description: "Start the production app in Daytona after a successful build. The platform injects PORT=3000 and HOSTNAME=0.0.0.0.",
        inputSchema: z.object({ command: z.string().min(1).max(200) }),
        execute: async ({ command }) => {
          try {
            if (!buildSucceeded) throw new Error("A successful production build is required before start_app.");
            const startCommand = validateStartCommand(command);
            appendLiveRunEvent(id, "sandbox", "info", `Starting generated app with PORT=${BUILDER_PORT}: ${startCommand}`);
            const response = await sandbox!.process.executeSessionCommand(
              "promptgolf-server",
              { command: `cd ${shellQuote(remoteRoot)} && PORT=${BUILDER_PORT} HOSTNAME=0.0.0.0 ${startCommand}`, runAsync: true, suppressInputEcho: true },
              8,
            );
            startCommandId = response.cmdId;
            appStarted = true;
            lastStartCommand = startCommand;
            return { ok: true, command: startCommand, commandId: response.cmdId ?? "started" };
          } catch (error) {
            const message = clip(error instanceof Error ? error.message : String(error), 1000);
            lastDiagnostics = message;
            return { ok: false, error: message };
          }
        },
      }),
      verify_health: tool({
        description: "Verify that the running app serves HTTP 200 on its health route from inside Daytona.",
        inputSchema: z.object({ path: z.string().default("/health") }),
        execute: async ({ path: routePath }) => {
          try {
            if (!appStarted) throw new Error("start_app must succeed before verify_health.");
            const safePath = validateRoutePath(routePath);
            const response = await runLocalHttpProbe({ sandbox: sandbox!, sessionId: "promptgolf-inspect", port: BUILDER_PORT, routePath: safePath, expectHtml: false });
            lastDiagnostics = clip(commandOutput(response));
            healthVerified = isSuccessExit(response.exitCode);
            if (healthVerified) lastHealthPath = safePath;
            return { ok: healthVerified, status: response.exitCode ?? 0, output: lastDiagnostics };
          } catch (error) {
            const message = clip(error instanceof Error ? error.message : String(error), 1000);
            lastDiagnostics = message;
            return { ok: false, error: message };
          }
        },
      }),
      verify_preview: tool({
        description: "Verify that the running app serves an HTML preview route from inside Daytona.",
        inputSchema: z.object({ path: z.string().default("/") }),
        execute: async ({ path: routePath }) => {
          try {
            if (!appStarted) throw new Error("start_app must succeed before verify_preview.");
            const safePath = validateRoutePath(routePath);
            const response = await runLocalHttpProbe({ sandbox: sandbox!, sessionId: "promptgolf-inspect", port: BUILDER_PORT, routePath: safePath, expectHtml: true });
            lastDiagnostics = clip(commandOutput(response));
            previewVerified = isSuccessExit(response.exitCode);
            if (previewVerified) lastPreviewPath = safePath;
            return { ok: previewVerified, status: response.exitCode ?? 0, output: lastDiagnostics };
          } catch (error) {
            const message = clip(error instanceof Error ? error.message : String(error), 1000);
            lastDiagnostics = message;
            return { ok: false, error: message };
          }
        },
      }),
      finalize: tool({
        description: "Finalize only after write, build, inspect/fix, start, health, and preview verification have succeeded.",
        inputSchema: FinalizeSchema,
        execute: async (input) => {
          try {
            if (!buildSucceeded || !appStarted || !healthVerified || !previewVerified) {
              throw new Error("Cannot finalize before successful build, start_app, verify_health, and verify_preview.");
            }
            const parsed = FinalizeSchema.parse({ ...input, healthPath: validateRoutePath(input.healthPath), previewPath: validateRoutePath(input.previewPath), manifestPath: normalizeRelativePath(input.manifestPath) });
            const manifest = await sandbox!.fs.downloadFile(toRemote(parsed.manifestPath), 20);
            if (!manifest.byteLength) throw new Error("Manifest file is empty or missing.");
            finalization = parsed;
            appendLiveRunEvent(id, "generate", "success", `Builder finalized: ${sanitizeLog(parsed.summary)}`);
            return { ok: true, finalized: true, previewPath: parsed.previewPath, healthPath: parsed.healthPath };
          } catch (error) {
            const message = clip(error instanceof Error ? error.message : String(error), 1000);
            lastDiagnostics = message;
            return { ok: false, error: message };
          }
        },
      }),
    };

    const stepState = { count: 0 };
    await generateText({
      model: openai.responses(OPENAI_BUILDER_MODEL),
      system:
        "You are PromptGolf's bounded coding agent. Use only the provided Daytona tools. Never ask for or expose secrets. Never call external provider CLIs. Keep all work under the workspace root. Required loop: write files, install/build/typecheck or test, inspect diagnostics, repair inside the workspace, start the app, verify health, verify preview, then finalize. Produce a framework-native multi-file project with complete dependencies, resolving imports, production build success, PORT support, HTTP 200 health route, accessible controls, responsive layout, visible loading/error/success states, and compliance with the contestant prompt. Do not reveal or infer hidden EvalSpecs. If the loop limit is reached, stop without claiming success.",
      prompt: buildPromptForContestant(prompt),
      tools,
      stopWhen: [hasToolCall("finalize"), stepCountIs(BUILDER_STEP_LIMIT)],
      maxRetries: 0,
      maxOutputTokens: BUILDER_MAX_OUTPUT_TOKENS,
      timeout: BUILDER_WALL_CLOCK_MS,
      providerOptions: {
        openai: {
          reasoningEffort: "medium",
          textVerbosity: "low",
        } satisfies OpenAIResponsesProviderOptions,
      },
      prepareStep: () => {
        if (finalization || !buildSucceeded || !appStarted || !healthVerified || !previewVerified) return undefined;
        return {
          activeTools: ["finalize"],
          toolChoice: { type: "tool", toolName: "finalize" },
          system: `All required Daytona checks have passed. Call finalize now and do not answer in prose. Use packageManager npm unless package.json proves otherwise. Use manifestPath package.json unless package.json is not the manifest. Known successful metadata: buildCommand=${lastBuildCommand}; startCommand=${lastStartCommand}; healthPath=${lastHealthPath}; previewPath=${lastPreviewPath}.`,
        };
      },
      experimental_onToolCallStart: ({ toolCall }) => {
        const toolName = toolCall.toolName;
        appendLiveRunEvent(id, toolName === "write_file" ? "generate" : "sandbox", "info", `Builder tool call: ${String(toolName)}`);
      },
      onStepFinish: (event) => {
        stepState.count += 1;
        const usage = event.usage;
        const tokenSummary = usage
          ? ` tokens in=${usage.inputTokens ?? "?"} out=${usage.outputTokens ?? "?"} total=${usage.totalTokens ?? "?"}`
          : " token usage unavailable";
        appendLiveRunEvent(id, "generate", "info", `Builder step ${stepState.count}/${BUILDER_STEP_LIMIT} finished;${tokenSummary}.`);
      },
    });

    if (!finalization) {
      throw new Error(`OpenAI builder loop ended without verified finalization after ${BUILDER_STEP_LIMIT} steps. Last diagnostics: ${clip(lastDiagnostics, 700)}`);
    }

    const workspace = await snapshotWorkspace({ sandbox, remoteRoot, finalization });
    const canonical = adaptWorkspace(workspace);
    appendLiveRunEvent(id, "generate", "success", `Artifact adapter mapped ${canonical.capabilities.length} declared capabilities without source resemblance grading.`);
    appendLiveRunEvent(id, "generate", "success", `Builder produced ${workspaceSummary(workspace)}.`);

    const preview = sandbox.getSignedPreviewUrl
      ? await sandbox.getSignedPreviewUrl(BUILDER_PORT, 900)
      : sandbox.getPreviewLink
        ? await sandbox.getPreviewLink(BUILDER_PORT)
        : undefined;
    const previewUrl = previewUrlFrom(preview);
    if (!previewUrl?.startsWith("http")) throw new Error("Daytona started the app but did not return a preview URL.");
    const rendered = new URL(previewUrl);
    rendered.pathname = finalization.previewPath;
    const upstreamPreviewUrl = rendered.toString();
    await waitForPreviewReady(id, upstreamPreviewUrl);
    const publicPreviewUrl = `${origin}/api/live-runs/${id}/preview`;
    updateLiveRun(id, {
      artifactWorkspace: workspace,
      upstreamPreviewUrl,
      previewUrl: publicPreviewUrl,
      previewLabel: "Daytona preview proxy",
      sandboxMode: `Daytona live · auto-delete ${sandbox.id ?? "configured"}`,
    });
    appendLiveRunEvent(id, "sandbox", "success", "Daytona build/start/health/preview verification succeeded. Preview is exposed through the same-origin proxy.");
    return { workspace, previewUrl: publicPreviewUrl, upstreamPreviewUrl };
  } catch (error) {
    if (sandbox?.delete) {
      await sandbox.delete(30).catch(() => undefined);
    }
    throw error;
  }
}

async function buildStubArtifact(id: string, origin: string) {
  const workspace = deterministicCheckoutWorkspace();
  updateLiveRun(id, {
    providerMode: `CI stub · OpenAI ${OPENAI_BUILDER_MODEL} not called`,
    sandboxMode: "CI stub · local artifact route",
    artifactWorkspace: workspace,
    previewUrl: `${origin}/api/live-runs/${id}/artifact`,
    previewLabel: "CI stub artifact",
  });
  appendLiveRunEvent(id, "generate", "success", "CI stub mode enabled: using deterministic generated checkout workspace with no network or secrets.");
  appendLiveRunEvent(id, "sandbox", "success", "CI stub mode skips Daytona creation; live runs without this flag require Daytona and have no local substitute.");
  return { workspace, previewUrl: `${origin}/api/live-runs/${id}/artifact` };
}

function booleanFrom(value: unknown) {
  return value === true || value === "true" || value === "pass" || value === "passed";
}

function styleResultFrom(data: z.infer<typeof VisualJudgeSchema>, id: string, fallbackLabel: string): LiveRunTestResult {
  const match = data.styleTests.find((item) => item.id === id);
  if (!match) {
    return { id, label: fallbackLabel, category: "style", passed: false, note: "OpenAI visual judge did not return a verdict for this style check." };
  }
  return { id, label: match.label || fallbackLabel, category: "style", passed: booleanFrom(match.passed), note: match.note.slice(0, 300) };
}

async function evaluateStyleWithOpenAI(id: string, url: string): Promise<LiveRunTestResult[]> {
  appendLiveRunEvent(id, "score", "info", "Capturing desktop and mobile Playwright screenshots for OpenAI visual judging.");
  const evidence = await captureVisualEvidence(url);

  if (stubsEnabled()) {
    appendLiveRunEvent(id, "score", "success", "CI stub mode: using deterministic OpenAI-style UI/UX verdicts for screenshot scoring.");
    return STYLE_TESTS.map((test) => ({ ...test, passed: true, note: "Stubbed OpenAI visual judge: generated checkout has clear hierarchy and usable responsive controls." }));
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    const message = "OPENAI_API_KEY is not configured.";
    appendLiveRunEvent(id, "score", "warning", `OpenAI visual judge unavailable: ${message}`);
    return STYLE_TESTS.map((test) => ({ ...test, passed: false, note: `OpenAI visual judge unavailable: ${message}` }));
  }

  try {
    appendLiveRunEvent(id, "score", "info", `Asking OpenAI (${OPENAI_VISUAL_JUDGE_MODEL}, reasoning low) to judge UI/UX from screenshots.`);
    const result = await generateObject({
      model: openai.responses(OPENAI_VISUAL_JUDGE_MODEL),
      schema: VisualJudgeSchema,
      system:
        "You are PromptGolf's screenshot evaluator. Judge only the rendered checkout UI from screenshots. Award exactly two binary style tests: visual hierarchy and mobile usability. Return strict structured output. Do not mention source code, CSS fingerprints, implementation resemblance, or hidden evaluator internals.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Evaluate this generated checkout app from Playwright screenshots. style-visual-hierarchy passes only if the desktop UI looks finished, readable, responsive, and clear enough for checkout. style-mobile-usability passes only if the mobile UI stacks cleanly, has usable tap targets, avoids horizontal overflow, and preserves checkout clarity. Visible page text snapshot: ${evidence.textSnapshot}`,
            },
            { type: "image", image: Buffer.from(evidence.desktopPngBase64, "base64"), mediaType: "image/png" },
            { type: "image", image: Buffer.from(evidence.mobilePngBase64, "base64"), mediaType: "image/png" },
          ],
        },
      ],
      maxOutputTokens: EVALUATION_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      timeout: EVALUATION_TIMEOUT_MS,
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          textVerbosity: "low",
        } satisfies OpenAIResponsesProviderOptions,
      },
    });

    const tests = STYLE_TESTS.map((test) => styleResultFrom(result.object, test.id, test.label));
    tests.forEach((test) => appendLiveRunEvent(id, "score", test.passed ? "success" : "error", `${test.passed ? "PASS" : "FAIL"}: ${test.label} - ${sanitizeLog(test.note)}`));
    return tests;
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    appendLiveRunEvent(id, "score", "warning", `OpenAI visual judge degraded: ${message}`);
    return STYLE_TESTS.map((test) => ({ ...test, passed: false, note: `OpenAI visual judge unavailable: ${message}` }));
  }
}

function categoryScores(tests: LiveRunTestResult[]): LiveRunCategoryScore[] {
  return (["functional", "hidden", "style"] as const).map((category) => {
    const categoryTests = tests.filter((test) => test.category === category);
    const passed = categoryTests.filter((test) => test.passed).length;
    const total = categoryTests.length;
    return { category, label: CATEGORY_LABELS[category], passed, total, score: total ? Math.round((passed / total) * 100) : 0 };
  });
}

function scoreTests(tests: LiveRunTestResult[]) {
  const passed = tests.filter((test) => test.passed).length;
  const total = tests.length;
  return { passed, total, finalScore: total ? Math.round((passed / total) * 100) : 0, categories: categoryScores(tests) };
}

async function diagnosePromptWithOpenAI(id: string, prompt: string, tests: LiveRunTestResult[], score: ReturnType<typeof scoreTests>): Promise<LiveRunSkillDiagnosis> {
  if (stubsEnabled()) {
    return {
      verdict: score.categories.find((category) => category.category === "hidden")?.passed === 3 ? "balanced" : "technical",
      promptingScore: 7,
      technicalScore: score.categories.find((category) => category.category === "hidden")?.passed === 3 ? 8 : 4,
      summary: "Prompt analysis: the score pattern separates spec clarity from ecommerce domain coverage.",
      promptingFeedback: "State required controls, states, and acceptance criteria directly.",
      technicalFeedback: "Include cents math, promo normalization, inventory limits, and checkout state.",
    };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      verdict: "degraded",
      promptingScore: 0,
      technicalScore: 0,
      summary: "Prompt analysis unavailable: OPENAI_API_KEY is not configured.",
      promptingFeedback: "Prompt analysis could not be completed by the live evaluator.",
      technicalFeedback: "Review failed functional and hidden checks to infer missing ecommerce/product knowledge.",
    };
  }

  try {
    appendLiveRunEvent(id, "score", "info", `Running OpenAI prompt diagnosis (${OPENAI_DIAGNOSIS_MODEL}, reasoning low) after deterministic scoring.`);
    const compactResults = tests.map((test) => ({ id: test.id, category: test.category, passed: test.passed, note: test.note.slice(0, 180) }));
    const result = await generateObject({
      model: openai.responses(OPENAI_DIAGNOSIS_MODEL),
      schema: SkillDiagnosisSchema,
      system:
        "You are PromptGolf's concise skill diagnostician. Score the submitted prompt, not the generated app alone. Decide whether failures mainly show prompting skill gaps, technical/domain knowledge gaps, or a balanced mix. Do not reveal hidden test answers verbatim. Return only the requested structured object.",
      prompt: `Prompt submitted by contestant:\n${prompt.slice(0, 5000)}\n\nOverall and category score:\n${JSON.stringify(score)}\n\nEvaluator results:\n${JSON.stringify(compactResults)}\n\nScoring rubric: promptingScore measures clarity, specificity, and testable acceptance criteria. technicalScore measures encoded product/domain engineering knowledge. Both are integers from 0 to 10. Keep feedback concise enough for a scorecard panel. Diagnosis must not modify the already-computed score.`,
      maxOutputTokens: 700,
      maxRetries: 0,
      timeout: EVALUATION_TIMEOUT_MS,
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          textVerbosity: "low",
        } satisfies OpenAIResponsesProviderOptions,
      },
    });
    return result.object;
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    appendLiveRunEvent(id, "score", "warning", `OpenAI prompt diagnosis degraded: ${message}`);
    return {
      verdict: "degraded",
      promptingScore: 0,
      technicalScore: 0,
      summary: `Prompt analysis unavailable: ${message}`,
      promptingFeedback: "Prompt analysis could not be completed by the live evaluator.",
      technicalFeedback: "Review failed functional and hidden checks to infer missing ecommerce/product knowledge.",
    };
  }
}

async function runPlaywright(id: string, url: string) {
  appendLiveRunEvent(id, "test", "info", `Materializing ${checkoutEvaluatorSpecs.length} stored EvalSpecs into deterministic Playwright checks for ${url}.`);
  return evaluateSpecsWithPlaywright({
    url,
    specs: checkoutEvaluatorSpecs,
    onResult: (result) => appendLiveRunEvent(id, "test", result.passed ? "success" : "error", `${result.passed ? "PASS" : "FAIL"}: ${result.label} - ${sanitizeLog(result.note)}`),
  });
}

export function startLiveRun(input: { prompt: string; challengeSlug?: string; origin?: string }) {
  const run = createLiveRun({ prompt: input.prompt, challengeSlug: input.challengeSlug ?? "mini-checkout-promo-engine" });
  try {
    liveRunScheduler.enqueue(() => executeLiveRun(run.id, absoluteOrigin(input.origin)));
  } catch (error) {
    deleteLiveRun(run.id);
    throw error;
  }
  const queue = liveRunScheduler.snapshot();
  if (queue.queued > 0) {
    appendLiveRunEvent(run.id, "queued", "info", `Run is waiting for a provider slot (${queue.queued} queued).`);
  }
  return run;
}

async function executeLiveRun(id: string, origin: string) {
  const run = getLiveRun(id);
  if (!run) return;
  try {
    updateLiveRun(id, {
      status: "running",
      providerState: [
        { ...getOpenAIAdapterStatus(), status: process.env.OPENAI_API_KEY?.trim() ? "connected" : "unavailable" },
        await probeDaytonaStatus(),
        { ...getStoredEvalSpecStatus(), status: "connected" },
      ],
    });
    appendLiveRunEvent(id, "generate", "info", "Starting live run. Contestant prompt is sent only to the OpenAI builder; stored EvalSpecs and credentials stay server-side.");
    appendLiveRunEvent(id, "test", "info", "Using stored validated EvalSpecs. Contestant runs do not regenerate evaluator specs.");

    const built = stubsEnabled() ? await buildStubArtifact(id, origin) : await buildInDaytona(id, run.prompt, origin);
    const testUrl = built.previewUrl;

    appendLiveRunEvent(id, "score", "info", "Starting Playwright behavior checks and OpenAI visual judging concurrently.");
    const [browserTests, styleTests] = await Promise.all([
      runPlaywright(id, testUrl),
      evaluateStyleWithOpenAI(id, testUrl),
    ]);
    const tests = [...browserTests, ...styleTests];
    const score = scoreTests(tests);
    updateLiveRun(id, { tests, score });
    appendLiveRunEvent(id, "score", "success", `Deterministic score computed before diagnosis: ${score.passed}/${score.total} checks passed (${score.finalScore}).`);
    const diagnosis = await diagnosePromptWithOpenAI(id, run.prompt, tests, score);
    updateLiveRun(id, { status: "completed", stage: "completed", tests, score, diagnosis });
    appendLiveRunEvent(id, "score", "success", `Live evaluation completed: ${score.passed}/${score.total} checks passed (${score.finalScore}). Functional ${score.categories[0].passed}/${score.categories[0].total}; hidden ${score.categories[1].passed}/${score.categories[1].total}; UI/UX ${score.categories[2].passed}/${score.categories[2].total}.`);
    appendLiveRunEvent(id, "completed", "success", "Run completed from generated artifact, Daytona preview, deterministic Playwright checks, OpenAI visual judging, and post-score diagnosis.");
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    updateLiveRun(id, { status: "failed", stage: "failed", error: message });
    appendLiveRunEvent(id, "failed", "error", `Live run failed honestly with no provider switch, fixture substitution, or post-builder artifact patch: ${message}`);
  }
}
