import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { z } from "zod";
import { collectRunProviderState, generateLiveTestDrafts } from "./adapters";
import { CHECKOUT_REQUIRED_CONTRACT_MARKERS, checkoutEvaluatorSpecs } from "./evaluator-specs";
import { deterministicCheckoutWorkspace } from "./live-run-fixture";
import { adaptWorkspace } from "./artifact-adapter";
import { parseWorkspace, workspaceFile, workspaceSummary, type WorkspaceManifest } from "./workspace";
import { appendLiveRunEvent, createLiveRun, deleteLiveRun, getLiveRun, sanitizeLog, updateLiveRun, type LiveRunCategoryScore, type LiveRunSkillDiagnosis, type LiveRunTestCategory, type LiveRunTestResult } from "./live-run-store";
import { captureVisualEvidence, evaluateSpecsWithPlaywright } from "./playwright-evaluator";
import { RunScheduler } from "./run-scheduler";
import { MAX_PROVIDER_RESPONSE_BYTES, readBoundedResponseText } from "./provider-response";

const AGNES_AI_BASE_URL = process.env.AGNES_AI_BASE_URL ?? "https://apihub.agnes-ai.com/v1";
const AGNES_AI_MODEL = process.env.AGNES_AI_MODEL ?? "agnes-2.0-flash";
const GENERATION_TIMEOUT_MS = Number(process.env.PROMPTGOLF_LIVE_GENERATION_TIMEOUT_MS ?? 240000);
const GENERATION_MAX_TOKENS = Number(process.env.PROMPTGOLF_LIVE_GENERATION_MAX_TOKENS ?? 4200);
const EVALUATION_TIMEOUT_MS = Number(process.env.PROMPTGOLF_LIVE_EVALUATION_TIMEOUT_MS ?? 45000);
const EVALUATION_MAX_TOKENS = Number(process.env.PROMPTGOLF_LIVE_EVALUATION_MAX_TOKENS ?? 900);
const DAYTONA_CREATE_TIMEOUT_SECONDS = Number(process.env.PROMPTGOLF_DAYTONA_CREATE_TIMEOUT_SECONDS ?? 30);
const DAYTONA_STEP_TIMEOUT_MS = Number(process.env.PROMPTGOLF_DAYTONA_STEP_TIMEOUT_MS ?? 30000);
const ALLOW_LOCAL_SANDBOX_FALLBACK = process.env.PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK === "1";
const configuredConcurrency = Number(process.env.PROMPTGOLF_LIVE_RUN_CONCURRENCY ?? 2);
const configuredQueueCapacity = Number(process.env.PROMPTGOLF_LIVE_RUN_QUEUE_CAPACITY ?? 20);
const liveRunScheduler = new RunScheduler(
  Number.isInteger(configuredConcurrency) && configuredConcurrency > 0 ? configuredConcurrency : 2,
  Number.isInteger(configuredQueueCapacity) && configuredQueueCapacity >= 0 ? configuredQueueCapacity : 20,
);

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

const SKILL_DIAGNOSIS_RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "promptgolf_skill_diagnosis",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["verdict", "promptingScore", "technicalScore", "summary", "promptingFeedback", "technicalFeedback"],
      properties: {
        verdict: { type: "string", enum: ["prompting", "technical", "balanced"], description: "Primary gap shown by the run." },
        promptingScore: { type: "integer", minimum: 0, maximum: 10, description: "How strong the contestant prompt was as an agentic prompt." },
        technicalScore: { type: "integer", minimum: 0, maximum: 10, description: "How much relevant product/domain engineering knowledge the prompt encoded." },
        summary: { type: "string", maxLength: 220, description: "One concise sentence explaining the score pattern." },
        promptingFeedback: { type: "string", maxLength: 180, description: "One concise actionable prompting improvement." },
        technicalFeedback: { type: "string", maxLength: 180, description: "One concise actionable product/domain knowledge improvement." },
      },
    },
  },
} satisfies Record<string, unknown>;

function stubsEnabled() {
  return process.env.PROMPTGOLF_TEST_PROVIDER_STUBS === "1";
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function absoluteOrigin(origin?: string) {
  return origin?.replace(/\/$/, "") || `http://127.0.0.1:${process.env.PORT || 3000}`;
}

function extractWorkspace(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced ?? text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("builder response did not contain a workspace manifest");
  return parseWorkspace(JSON.parse(candidate.slice(start, end + 1)));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function observeArtifactContract(id: string, workspace: WorkspaceManifest, provider: string) {
  const html = workspaceFile(workspace, workspace.entrypoints.preview) ?? "";
  const missingContract = CHECKOUT_REQUIRED_CONTRACT_MARKERS.filter((snippet) => !html.toLowerCase().includes(snippet.toLowerCase()));
  if (missingContract.length) appendLiveRunEvent(id, "generate", "warning", `${provider} artifact missed checkout contract markers: ${missingContract.slice(0, 5).join(", ")}${missingContract.length > 5 ? "…" : ""}. The generated app will be evaluated as-is.`);
}

async function waitForPreviewReady(id: string, url: string) {
  appendLiveRunEvent(id, "sandbox", "info", "Waiting for sandbox preview to serve the generated artifact before starting Playwright.");
  let lastObservation = "no response received";
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      const body = await response.text();
      if (response.ok && /<!doctype html>|<html[\s>]/i.test(body)) return;
      const bodyPreview = body.replace(/\s+/g, " ").slice(0, 160);
      lastObservation = `HTTP ${response.status}; body: ${bodyPreview || "empty"}`;
    } catch {
      lastObservation = "fetch failed while polling sandbox preview";
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Sandbox preview did not serve the generated checkout artifact before the demo timeout (${sanitizeLog(lastObservation)})`);
}

function previewUrlFrom(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "url" in value) return String(value.url);
  return undefined;
}

function extractChatContent(data: unknown) {
  if (typeof data !== "object" || data === null || !("choices" in data) || !Array.isArray(data.choices)) return "";
  const [choice] = data.choices;
  if (typeof choice !== "object" || choice === null) return "";
  const delta = "delta" in choice ? choice.delta : undefined;
  if (typeof delta === "object" && delta !== null && "content" in delta && typeof delta.content === "string") return delta.content;
  const message = "message" in choice ? choice.message : undefined;
  if (typeof message === "object" && message !== null && "content" in message && typeof message.content === "string") return message.content;
  return "";
}

async function readStreamedChatCompletion(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("provider did not return a readable stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let receivedBytes = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_PROVIDER_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Provider response exceeded the size limit.");
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") return text;
        try {
          text += extractChatContent(JSON.parse(payload));
        } catch {
          // Ignore non-JSON keepalive chunks from OpenAI-compatible gateways.
        }

      }
    }
  } finally {
    reader.releaseLock();
  }

  return text;
}

async function generateViaOpenAICompatible(input: { credential: string; baseUrl: string; model: string; provider: string; prompt: string }) {
  const controller = new AbortController();
  let timedOut = false;
  const useStreaming = true;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, GENERATION_TIMEOUT_MS);
  try {
    const response = await fetch(joinUrl(input.baseUrl, "/chat/completions"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${input.credential}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        temperature: 0.25,
        max_tokens: GENERATION_MAX_TOKENS,
        stream: useStreaming,
        messages: [
          {
            role: "system",
            content:
              "Act as an autonomous project builder. Return JSON only matching {schemaVersion:1,framework,language,packageManager,files:[{path,content}],commands:{install?,build,start},runtime:{port,healthPath},entrypoints:{preview,manifest}}. Create a genuine framework-native, multi-file full-stack checkout project in the framework requested by the contestant (default Next.js). Include package/framework manifest, source files, API/server behavior, and real build/start commands. entrypoints.preview must be an HTML file the evaluator can render directly as deterministic evidence. Never return a single-file project. Public brief: ecommerce checkout with quantities, promos, totals, tax, and confirmation. Implement exactly the contestant spec; do not silently add omitted edge cases.",
          },
          { role: "user", content: input.prompt.slice(0, 6000) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const raw = await readBoundedResponseText(response);
      throw new Error(`${input.provider} HTTP ${response.status}: ${raw.slice(0, 220)}`);
    }
    const text = useStreaming ? await readStreamedChatCompletion(response) : extractChatContent(await response.json());
    return extractWorkspace(text);
  } catch (error) {
    if (timedOut) throw new Error(`${input.provider} generation exceeded ${Math.round(GENERATION_TIMEOUT_MS / 1000)}s timeout while creating the checkout artifact`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function extractJsonObject(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced ?? text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("model response did not include a JSON object");
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

async function generateAgnesJson(input: { system: string; content: unknown; maxTokens?: number; responseFormat?: Record<string, unknown> }) {
  const apiKey = process.env.AGNES_AI_API_KEY?.trim();
  if (!apiKey) throw new Error("AGNES_AI_API_KEY is not configured");

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, EVALUATION_TIMEOUT_MS);

  try {
    const response = await fetch(joinUrl(AGNES_AI_BASE_URL, "/chat/completions"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AGNES_AI_MODEL,
        temperature: 0.2,
        max_tokens: input.maxTokens ?? EVALUATION_MAX_TOKENS,
        stream: false,
        ...(input.responseFormat ? { response_format: input.responseFormat } : {}),
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.content },
        ],
      }),
      signal: controller.signal,
    });

    const raw = await readBoundedResponseText(response);
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : undefined;
    } catch {
      data = undefined;
    }

    if (!response.ok) throw new Error(`Agnes AI HTTP ${response.status}: ${raw.slice(0, 220)}`);
    const text = extractChatContent(data);
    if (!text.trim()) throw new Error("Agnes AI returned no evaluator content");
    return extractJsonObject(text);
  } catch (error) {
    if (timedOut) throw new Error(`Agnes AI evaluation exceeded ${Math.round(EVALUATION_TIMEOUT_MS / 1000)}s timeout`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function booleanFrom(value: unknown) {
  return value === true || value === "true" || value === "pass" || value === "passed";
}

function styleResultFrom(data: unknown, id: string, fallbackLabel: string): LiveRunTestResult | undefined {
  if (typeof data !== "object" || data === null || !("styleTests" in data) || !Array.isArray(data.styleTests)) return undefined;
  const match = data.styleTests.find((item) => typeof item === "object" && item !== null && "id" in item && item.id === id);
  if (typeof match !== "object" || match === null) return undefined;
  const note = "note" in match && typeof match.note === "string" ? match.note : "Agnes AI screenshot judge returned a style verdict.";
  return { id, label: "label" in match && typeof match.label === "string" ? match.label : fallbackLabel, category: "style", passed: booleanFrom("passed" in match ? match.passed : false), note: note.slice(0, 300) };
}

async function evaluateStyleWithAgnes(id: string, url: string): Promise<LiveRunTestResult[]> {
  appendLiveRunEvent(id, "score", "info", "Capturing desktop and mobile Playwright screenshots for Agnes AI UI/UX evaluation.");
  const evidence = await captureVisualEvidence(url);

  if (stubsEnabled()) {
    appendLiveRunEvent(id, "score", "success", "CI stub mode: using deterministic Agnes-style UI/UX verdicts for screenshot scoring.");
    return STYLE_TESTS.map((test) => ({ ...test, passed: true, note: "Stubbed Agnes UI/UX judge: generated checkout has clear hierarchy and usable responsive controls." }));
  }

  try {
    appendLiveRunEvent(id, "score", "info", "Asking Agnes AI to judge UI/UX from the captured screenshots.");
    const data = await generateAgnesJson({
      system:
        "You are PromptGolf's Agnes AI screenshot evaluator. Judge only the rendered checkout UI from the screenshots. Reward a premium finished consumer checkout: clear hierarchy, tactile double-bezel/card structure, refined spacing, readable totals, strong CTA, visible states, non-generic styling, no gradient text, no sloppy Bootstrap-like layout. Return strict JSON with styleTests for exactly style-visual-hierarchy and style-mobile-usability. Each item needs id, label, passed boolean, and note. Do not use markdown.",
      content: [
        {
          type: "text",
          text: `Evaluate this generated checkout app from Playwright screenshots. Award two binary UI/UX tests. style-visual-hierarchy passes only if the desktop UI looks like a polished premium checkout with clear product hierarchy, tactile cards, readable order summary, refined spacing, and visible error/success states. style-mobile-usability passes only if the mobile UI stacks cleanly, keeps inputs/buttons easy to tap, avoids horizontal overflow, and preserves checkout clarity. Visible page text snapshot: ${evidence.textSnapshot}`,
        },
        { type: "image_url", image_url: { url: `data:image/png;base64,${evidence.desktopPngBase64}` } },
        { type: "image_url", image_url: { url: `data:image/png;base64,${evidence.mobilePngBase64}` } },
      ],
    });

    const tests = STYLE_TESTS.map((test) => styleResultFrom(data, test.id, test.label) ?? { ...test, passed: false, note: "Agnes AI did not return a valid verdict for this style check." });
    tests.forEach((test) => appendLiveRunEvent(id, "score", test.passed ? "success" : "error", `${test.passed ? "PASS" : "FAIL"}: ${test.label} - ${sanitizeLog(test.note)}`));
    return tests;
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    appendLiveRunEvent(id, "score", "warning", `Agnes AI screenshot evaluation degraded: ${message}`);
    return STYLE_TESTS.map((test) => ({ ...test, passed: false, note: `Agnes AI screenshot evaluation unavailable: ${message}` }));
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

function diagnosisFrom(data: unknown): LiveRunSkillDiagnosis | undefined {
  const parsed = SkillDiagnosisSchema.safeParse(data);
  if (!parsed.success) return undefined;
  return parsed.data;
}

async function diagnosePromptWithAgnes(id: string, prompt: string, tests: LiveRunTestResult[], score: ReturnType<typeof scoreTests>): Promise<LiveRunSkillDiagnosis> {
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

  try {
    appendLiveRunEvent(id, "score", "info", "Running Agnes-backed prompt analysis against prompting skill and technical/domain gaps.");
    const compactResults = tests.map((test) => ({ id: test.id, category: test.category, passed: test.passed, note: test.note.slice(0, 180) }));
    const data = await generateAgnesJson({
      system:
        "You are PromptGolf's concise skill diagnostician. Score the submitted prompt, not the generated app alone. Decide whether failures mainly show prompting skill gaps, technical/domain knowledge gaps, or a balanced mix. Do not reveal hidden test answers verbatim. Return only the requested structured object.",
      content: `Prompt submitted by contestant:\n${prompt.slice(0, 5000)}\n\nOverall and category score:\n${JSON.stringify(score)}\n\nFailed and passed evaluator results:\n${JSON.stringify(compactResults)}\n\nScoring rubric: promptingScore measures clarity, specificity, and testable acceptance criteria. technicalScore measures encoded product/domain engineering knowledge. Both are integers from 0 to 10. Keep feedback concise enough for a scorecard panel.`,
      maxTokens: 700,
      responseFormat: SKILL_DIAGNOSIS_RESPONSE_FORMAT,
    });
    return diagnosisFrom(data) ?? {
      verdict: "degraded",
      promptingScore: 0,
      technicalScore: 0,
      summary: "Prompt analysis returned an incomplete result.",
      promptingFeedback: "The prompt needs clearer acceptance criteria.",
      technicalFeedback: "The prompt needs more ecommerce edge-case coverage.",
    };
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    appendLiveRunEvent(id, "score", "warning", `Agnes-backed prompt analysis degraded: ${message}`);
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

async function generateArtifact(id: string, prompt: string) {
  if (stubsEnabled()) {
    appendLiveRunEvent(id, "generate", "success", "CI stub mode enabled: using deterministic generated checkout artifact with no network or secrets.");
    updateLiveRun(id, { providerMode: "stubbed fixture" });
    return deterministicCheckoutWorkspace();
  }

  const agnesKey = process.env.AGNES_AI_API_KEY?.trim();
  if (agnesKey) {
    try {
      appendLiveRunEvent(id, "generate", "info", `Building a framework-native project workspace with Agnes AI (${AGNES_AI_MODEL}).`);
      const workspace = await generateViaOpenAICompatible({ credential: agnesKey, baseUrl: AGNES_AI_BASE_URL, model: AGNES_AI_MODEL, provider: "Agnes AI", prompt });
      observeArtifactContract(id, workspace, "Agnes AI");
      updateLiveRun(id, { providerMode: `Agnes AI live · ${AGNES_AI_MODEL}` });
      appendLiveRunEvent(id, "generate", "success", `Builder returned ${workspaceSummary(workspace)}. It will be evaluated as generated with no repair.`);
      return workspace;
    } catch (error) {
      updateLiveRun(id, { providerMode: "Agnes AI live generation failed" });
      throw new Error(`Agnes AI live generation failed without repair fallback: ${sanitizeLog(error instanceof Error ? error.message : String(error))}`);
    }
  } else {
    updateLiveRun(id, { providerMode: "Agnes AI unavailable" });
    throw new Error("AGNES_AI_API_KEY is not configured. Live demo mode does not use deterministic repair artifacts.");
  }
}

async function attemptDaytonaPreview(id: string, workspace: WorkspaceManifest) {
  if (!workspaceFile(workspace, workspace.entrypoints.preview)) throw new Error("Workspace preview entrypoint is unavailable.");
  if (stubsEnabled()) {
    updateLiveRun(id, { sandboxMode: "CI stub · local artifact route" });
    appendLiveRunEvent(id, "sandbox", "info", "CI stub mode avoids sandbox network calls and uses the local artifact route.");
    return undefined;
  }
  if (!process.env.DAYTONA_API_KEY?.trim()) {
    updateLiveRun(id, { sandboxMode: "Sandbox unavailable · no local fallback" });
    if (ALLOW_LOCAL_SANDBOX_FALLBACK) {
      appendLiveRunEvent(id, "sandbox", "warning", "Sandbox credentials are not configured. Explicit PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK=1 is set, so this run will use the local artifact route and be labeled degraded.");
      return undefined;
    }
    throw new Error("Sandbox credentials are not configured. Live demo mode requires the sandbox adapter unless PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK=1 is explicitly set.");
  }

  try {
    appendLiveRunEvent(id, "sandbox", "info", "Attempting sandbox creation for preview execution.");
    const sdk = await import("@daytonaio/sdk");
    const daytona = new sdk.Daytona();
    const sandbox = await daytona.create(
      {
        language: "typescript",
        autoStopInterval: 10,
        autoArchiveInterval: 10,
        autoDeleteInterval: 30,
        labels: { app: "promptgolf", run: id },
      },
      { timeout: DAYTONA_CREATE_TIMEOUT_SECONDS },
    );
    if (!sandbox || typeof sandbox !== "object") throw new Error("Sandbox SDK did not return a sandbox object");
    if ("waitUntilStarted" in sandbox && typeof sandbox.waitUntilStarted === "function") await withTimeout(sandbox.waitUntilStarted(), DAYTONA_STEP_TIMEOUT_MS, "Sandbox did not reach started state before the demo timeout");

    const tempDir = await mkdtemp(path.join(tmpdir(), "promptgolf-daytona-"));
    try {
      const remoteDir = "/home/daytona/promptgolf-live";
      if (!("fs" in sandbox) || typeof sandbox.fs !== "object" || !sandbox.fs || !("uploadFile" in sandbox.fs)) {
        throw new Error("Sandbox fs.uploadFile is unavailable in this SDK shape");
      }
      if (!("process" in sandbox) || typeof sandbox.process !== "object" || !sandbox.process || !("createSession" in sandbox.process) || !("executeSessionCommand" in sandbox.process)) {
        throw new Error("Sandbox process session API is unavailable in this SDK shape");
      }
      const processApi = sandbox.process as {
        createSession: (sessionId: string) => Promise<void>;
        executeSessionCommand: (sessionId: string, req: { command: string; runAsync?: boolean }, timeout?: number) => Promise<{ stdout?: string; stderr?: string; exitCode?: number; cmdId?: string }>;
      };
      await processApi.createSession("promptgolf");
      await processApi.createSession("promptgolf-probe");
      await processApi.executeSessionCommand("promptgolf", { command: `mkdir -p ${remoteDir}` }, 10);
      for (const file of workspace.files) {
        const localFile = path.join(tempDir, file.path);
        await mkdir(path.dirname(localFile), { recursive: true });
        await writeFile(localFile, file.content, "utf8");
        const remoteFile = `${remoteDir}/${file.path}`;
        await processApi.executeSessionCommand("promptgolf", { command: `mkdir -p ${path.posix.dirname(remoteFile)}` }, 10);
        await (sandbox.fs as { uploadFile: (src: string, dst: string, timeout?: number) => Promise<void> }).uploadFile(localFile, remoteFile, 30);
      }
      if (workspace.commands.install) await processApi.executeSessionCommand("promptgolf", { command: `cd ${remoteDir} && ${workspace.commands.install}` }, 120);
      const build = await processApi.executeSessionCommand("promptgolf", { command: `cd ${remoteDir} && ${workspace.commands.build}` }, 180);
      if (build.exitCode) throw new Error(`Workspace build failed: ${build.stderr || build.stdout || `exit ${build.exitCode}`}`);
      await processApi.executeSessionCommand("promptgolf", { command: `cd ${remoteDir} && PORT=${workspace.runtime.port} ${workspace.commands.start}`, runAsync: true }, 5);
      const localProbe = await processApi.executeSessionCommand(
        "promptgolf-probe",
        {
          command: `python3 - <<'PY'
import time
import urllib.request
last = ''
for _ in range(10):
  try:
    body = urllib.request.urlopen('http://127.0.0.1:${workspace.runtime.port}${workspace.runtime.healthPath}', timeout=2).read().decode('utf-8', 'ignore')
    print('probe_ok', len(body))
    raise SystemExit(0)
  except Exception as exc:
    last = str(exc)
    time.sleep(0.5)
print('probe_failed', last)
raise SystemExit(1)
PY`,
        },
        10,
      );
      if (localProbe.exitCode && localProbe.exitCode !== 0) throw new Error(`Sandbox local server probe failed: ${localProbe.stderr || localProbe.stdout || `exit ${localProbe.exitCode}`}`);
      if (!localProbe.stdout?.includes("probe_ok")) throw new Error(`Sandbox local server health route did not respond: ${localProbe.stdout || localProbe.stderr || "empty probe output"}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    const preview =
      "getSignedPreviewUrl" in sandbox && typeof sandbox.getSignedPreviewUrl === "function"
        ? await withTimeout(sandbox.getSignedPreviewUrl(workspace.runtime.port, 300), 10000, "Sandbox signed preview URL was not returned before the demo timeout")
        : "getPreviewLink" in sandbox && typeof sandbox.getPreviewLink === "function"
          ? await withTimeout(sandbox.getPreviewLink(workspace.runtime.port), 10000, "Sandbox preview link was not returned before the demo timeout")
          : undefined;
    const previewUrl = previewUrlFrom(preview);
    if (previewUrl?.startsWith("http")) {
      await waitForPreviewReady(id, previewUrl);
      updateLiveRun(id, { sandboxMode: "Sandbox preview", previewUrl, previewLabel: "Sandbox preview" });
      appendLiveRunEvent(id, "sandbox", "success", `Sandbox preview available and serving generated artifact: ${previewUrl}`);
      return previewUrl;
    }
    throw new Error("Sandbox started but no preview URL was returned");
  } catch (error) {
    updateLiveRun(id, { sandboxMode: ALLOW_LOCAL_SANDBOX_FALLBACK ? "local fallback · sandbox SDK degraded" : "Sandbox SDK degraded · no local fallback" });
    if (ALLOW_LOCAL_SANDBOX_FALLBACK) {
      appendLiveRunEvent(id, "sandbox", "warning", `Sandbox attempt failed: ${sanitizeLog(error instanceof Error ? error.message : String(error))}. Explicit local fallback is enabled, so Playwright will use the local artifact route.`);
      return undefined;
    }
    throw new Error(`Sandbox attempt failed and live demo mode does not use local fallback: ${sanitizeLog(error instanceof Error ? error.message : String(error))}`);
  }
}

async function generateTokenRouterEvaluatorDrafts(id: string) {
  appendLiveRunEvent(id, "test", "info", "Routing functional and hidden evaluator specs through TokenRouter before deterministic Playwright scoring.");
  const draft = await generateLiveTestDrafts(checkoutEvaluatorSpecs.map((spec) => ({ title: `${spec.label}: ${spec.intent}` })));
  if (draft.provider.name !== "TokenRouter" || draft.provider.status !== "connected" || draft.tests.length === 0) {
    throw new Error(`TokenRouter evaluator draft generation was unavailable; provider=${draft.provider.name}, status=${draft.provider.status}. Live demo mode requires TokenRouter for cache-friendly test drafts.`);
  }
  appendLiveRunEvent(id, "test", "success", `TokenRouter generated ${draft.tests.length} cache-friendly Playwright evaluator draft${draft.tests.length === 1 ? "" : "s"}; deterministic Playwright will execute the validated spec materialization.`);
  draft.tests.slice(0, 3).forEach((test) => appendLiveRunEvent(id, "test", "info", `TokenRouter draft: ${sanitizeLog(test.title)}`));
}

async function runPlaywright(id: string, url: string) {
  appendLiveRunEvent(id, "test", "info", `Materializing ${checkoutEvaluatorSpecs.length} natural-language evaluator specs into Playwright checks for ${url}.`);
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
    updateLiveRun(id, { status: "running" });
    appendLiveRunEvent(id, "generate", "info", "Starting live artifact generation. Provider probes are deferred so they do not compete with the Agnes builder call.");
    const workspace = await generateArtifact(id, run.prompt);
    const canonical = adaptWorkspace(workspace);
    updateLiveRun(id, { artifactWorkspace: workspace });
    appendLiveRunEvent(id, "generate", "success", `Artifact adapter mapped ${canonical.capabilities.length} canonical capabilities without source-structure grading.`);
    collectRunProviderState(run.prompt).then((providerState) => updateLiveRun(id, { providerState })).catch(() => undefined);

    const daytonaPreview = await attemptDaytonaPreview(id, workspace);
    const localPreview = `${origin}/api/live-runs/${id}/artifact`;
    if (!daytonaPreview) updateLiveRun(id, { previewUrl: localPreview, previewLabel: stubsEnabled() ? "Local generated artifact · CI stub" : "Local generated artifact · explicit sandbox fallback" });

    const testUrl = daytonaPreview ?? localPreview;
    await generateTokenRouterEvaluatorDrafts(id);
    const browserTests = await runPlaywright(id, testUrl);
    const styleTests = await evaluateStyleWithAgnes(id, testUrl);
    const tests = [...browserTests, ...styleTests];
    const score = scoreTests(tests);
    const diagnosis = await diagnosePromptWithAgnes(id, run.prompt, tests, score);
    updateLiveRun(id, { status: "completed", stage: "completed", tests, score, diagnosis });
    appendLiveRunEvent(id, "score", "success", `Live evaluation completed: ${score.passed}/${score.total} checks passed (${score.finalScore}). Functional ${score.categories[0].passed}/${score.categories[0].total}; hidden ${score.categories[1].passed}/${score.categories[1].total}; UI/UX ${score.categories[2].passed}/${score.categories[2].total}.`);
    appendLiveRunEvent(id, "completed", "success", "Run completed from generated artifact and real browser test results.");
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    updateLiveRun(id, { status: "failed", stage: "failed", error: message });
    appendLiveRunEvent(id, "failed", "error", `Live run failed: ${message}`);
  }
}
