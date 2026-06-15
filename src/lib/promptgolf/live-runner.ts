import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { collectRunProviderState, generateLiveTestDrafts } from "./adapters";
import { CHECKOUT_REQUIRED_CONTRACT_MARKERS, checkoutEvaluatorSpecs } from "./evaluator-specs";
import { deterministicCheckoutArtifact } from "./live-run-fixture";
import { appendLiveRunEvent, createLiveRun, getLiveRun, sanitizeLog, updateLiveRun } from "./live-run-store";
import { evaluateSpecsWithPlaywright } from "./playwright-evaluator";

const AGNES_AI_BASE_URL = process.env.AGNES_AI_BASE_URL ?? "https://apihub.agnes-ai.com/v1";
const AGNES_AI_MODEL = process.env.AGNES_AI_MODEL ?? "agnes-2.0-flash";
const GENERATION_TIMEOUT_MS = Number(process.env.PROMPTGOLF_LIVE_GENERATION_TIMEOUT_MS ?? 240000);
const GENERATION_MAX_TOKENS = Number(process.env.PROMPTGOLF_LIVE_GENERATION_MAX_TOKENS ?? 4200);
const DAYTONA_CREATE_TIMEOUT_SECONDS = Number(process.env.PROMPTGOLF_DAYTONA_CREATE_TIMEOUT_SECONDS ?? 30);
const DAYTONA_STEP_TIMEOUT_MS = Number(process.env.PROMPTGOLF_DAYTONA_STEP_TIMEOUT_MS ?? 30000);
const ALLOW_LOCAL_SANDBOX_FALLBACK = process.env.PROMPTGOLF_ALLOW_LOCAL_SANDBOX_FALLBACK === "1";

function stubsEnabled() {
  return process.env.PROMPTGOLF_TEST_PROVIDER_STUBS === "1";
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function absoluteOrigin(origin?: string) {
  return origin?.replace(/\/$/, "") || `http://127.0.0.1:${process.env.PORT || 3000}`;
}

function extractHtml(text: string) {
  const fenced = text.match(/```(?:html)?\s*([\s\S]*?)```/i)?.[1];
  const candidate = (fenced ?? text).trim();
  const start = candidate.search(/<!doctype html>|<html[\s>]/i);
  if (start < 0) throw new Error("model response did not contain a complete HTML document");
  return candidate.slice(start);
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

function observeArtifactContract(id: string, html: string, provider: string) {
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

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
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
        if (/<\/html>/i.test(text)) {
          await reader.cancel().catch(() => undefined);
          return text;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return text;
}

async function generateViaOpenAICompatible(input: { apiKey: string; baseUrl: string; model: string; provider: string; prompt: string }) {
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
        Authorization: `Bearer ${input.apiKey}`,
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
              "Return one compact self-contained HTML document only. No markdown. Inline CSS and JS. Public brief: full-stack ecommerce checkout web app with cart items, quantities, promo codes, subtotal, shipping, tax, and order confirmation. Use seed items Canvas tote, Espresso beans, and Stoneware mug. Use semantic HTML with visible labels for Promo code, Subtotal, Discount, Shipping, Tax, Total, and accessible button names such as Increase Canvas tote, Decrease Canvas tote, Increase Stoneware mug, and Decrease Stoneware mug. Keep code concise. Implement exactly what the user's prompt asks. If the prompt omits business edge cases, use straightforward happy-path behavior rather than adding production safeguards.",
          },
          { role: "user", content: input.prompt.slice(0, 6000) },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const raw = await response.text();
      throw new Error(`${input.provider} HTTP ${response.status}: ${raw.slice(0, 220)}`);
    }
    const text = useStreaming ? await readStreamedChatCompletion(response) : extractChatContent(await response.json());
    return extractHtml(text);
  } catch (error) {
    if (timedOut) throw new Error(`${input.provider} generation exceeded ${Math.round(GENERATION_TIMEOUT_MS / 1000)}s timeout while creating the checkout artifact`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateArtifact(id: string, prompt: string) {
  if (stubsEnabled()) {
    appendLiveRunEvent(id, "generate", "success", "CI stub mode enabled: using deterministic generated checkout artifact with no network or secrets.");
    updateLiveRun(id, { providerMode: "stubbed fixture" });
    return deterministicCheckoutArtifact();
  }

  const agnesKey = process.env.AGNES_AI_API_KEY?.trim();
  if (agnesKey) {
    try {
      appendLiveRunEvent(id, "generate", "info", `Generating self-contained checkout app with Agnes AI (${AGNES_AI_MODEL}).`);
      const html = await generateViaOpenAICompatible({ apiKey: agnesKey, baseUrl: AGNES_AI_BASE_URL, model: AGNES_AI_MODEL, provider: "Agnes AI", prompt });
      observeArtifactContract(id, html, "Agnes AI");
      updateLiveRun(id, { providerMode: `Agnes AI live · ${AGNES_AI_MODEL}` });
      appendLiveRunEvent(id, "generate", "success", "Agnes AI returned a checkout artifact. It will be evaluated as generated, with no deterministic repair artifact.");
      return html;
    } catch (error) {
      updateLiveRun(id, { providerMode: "Agnes AI live generation failed" });
      throw new Error(`Agnes AI live generation failed without repair fallback: ${sanitizeLog(error instanceof Error ? error.message : String(error))}`);
    }
  } else {
    updateLiveRun(id, { providerMode: "Agnes AI unavailable" });
    throw new Error("AGNES_AI_API_KEY is not configured. Live demo mode does not use deterministic repair artifacts.");
  }
}

async function attemptDaytonaPreview(id: string, html: string) {
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
      const localFile = path.join(tempDir, "index.html");
      await writeFile(localFile, html, "utf8");
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
      await (sandbox.fs as { uploadFile: (src: string, dst: string, timeout?: number) => Promise<void> }).uploadFile(localFile, `${remoteDir}/index.html`, 30);
      await processApi.executeSessionCommand("promptgolf", { command: `cd ${remoteDir} && python3 -m http.server 3000`, runAsync: true }, 5);
      const localProbe = await processApi.executeSessionCommand(
        "promptgolf-probe",
        {
          command: `python3 - <<'PY'
import time
import urllib.request
last = ''
for _ in range(10):
  try:
    body = urllib.request.urlopen('http://127.0.0.1:3000', timeout=2).read().decode('utf-8', 'ignore')
    print('probe_ok', len(body), '<html' in body.lower())
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
      if (!localProbe.stdout?.includes("probe_ok") || !localProbe.stdout.includes("True")) throw new Error(`Sandbox local server did not serve an HTML artifact: ${localProbe.stdout || localProbe.stderr || "empty probe output"}`);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    const preview =
      "getSignedPreviewUrl" in sandbox && typeof sandbox.getSignedPreviewUrl === "function"
        ? await withTimeout(sandbox.getSignedPreviewUrl(3000, 300), 10000, "Sandbox signed preview URL was not returned before the demo timeout")
        : "getPreviewLink" in sandbox && typeof sandbox.getPreviewLink === "function"
          ? await withTimeout(sandbox.getPreviewLink(3000), 10000, "Sandbox preview link was not returned before the demo timeout")
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
  appendLiveRunEvent(id, "test", "info", "Routing stable hidden evaluator specs through TokenRouter before deterministic Playwright scoring.");
  const draft = await generateLiveTestDrafts(checkoutEvaluatorSpecs.map((spec) => ({ title: `${spec.label}: ${spec.intent}` })));
  if (draft.provider.name !== "TokenRouter" || draft.provider.status !== "connected" || draft.tests.length === 0) {
    throw new Error(`TokenRouter evaluator draft generation was unavailable; provider=${draft.provider.name}, status=${draft.provider.status}. Live demo mode requires TokenRouter for cache-friendly test drafts.`);
  }
  appendLiveRunEvent(id, "test", "success", `TokenRouter generated ${draft.tests.length} cache-friendly evaluator draft${draft.tests.length === 1 ? "" : "s"}; deterministic Playwright will execute the validated spec materialization.`);
  draft.tests.slice(0, 3).forEach((test) => appendLiveRunEvent(id, "test", "info", `TokenRouter draft: ${sanitizeLog(test.title)}`));
}

async function runPlaywright(id: string, url: string) {
  appendLiveRunEvent(id, "test", "info", `Materializing ${checkoutEvaluatorSpecs.length} natural-language evaluator specs into Playwright checks for ${url}.`);
  return evaluateSpecsWithPlaywright({
    url,
    specs: checkoutEvaluatorSpecs,
    onResult: (result) => appendLiveRunEvent(id, "test", result.passed ? "success" : "error", `${result.passed ? "PASS" : "FAIL"}: ${result.label} — ${sanitizeLog(result.note)}`),
  });
}

export function startLiveRun(input: { prompt: string; challengeSlug?: string; origin?: string }) {
  const run = createLiveRun({ prompt: input.prompt, challengeSlug: input.challengeSlug ?? "mini-checkout-promo-engine" });
  void executeLiveRun(run.id, absoluteOrigin(input.origin));
  return run;
}

async function executeLiveRun(id: string, origin: string) {
  const run = getLiveRun(id);
  if (!run) return;
  try {
    updateLiveRun(id, { status: "running" });
    appendLiveRunEvent(id, "generate", "info", "Starting live artifact generation. Provider probes are deferred so they do not compete with the Agnes builder call.");
    const html = await generateArtifact(id, run.prompt);
    updateLiveRun(id, { artifactHtml: html });
    collectRunProviderState(run.prompt).then((providerState) => updateLiveRun(id, { providerState })).catch(() => undefined);

    const daytonaPreview = await attemptDaytonaPreview(id, html);
    const localPreview = `${origin}/api/live-runs/${id}/artifact`;
    if (!daytonaPreview) updateLiveRun(id, { previewUrl: localPreview, previewLabel: stubsEnabled() ? "Local generated artifact · CI stub" : "Local generated artifact · explicit sandbox fallback" });

    const testUrl = daytonaPreview ?? localPreview;
    await generateTokenRouterEvaluatorDrafts(id);
    const tests = await runPlaywright(id, testUrl);
    const passed = tests.filter((test) => test.passed).length;
    const total = tests.length;
    const finalScore = total ? Math.round((passed / total) * 100) : 0;
    updateLiveRun(id, { status: "completed", stage: "completed", tests, score: { passed, total, finalScore } });
    appendLiveRunEvent(id, "score", "success", `Live Playwright evaluation completed: ${passed}/${total} checks passed (${finalScore}).`);
    appendLiveRunEvent(id, "completed", "success", "Run completed from generated artifact and real browser test results.");
  } catch (error) {
    const message = sanitizeLog(error instanceof Error ? error.message : String(error));
    updateLiveRun(id, { status: "failed", stage: "failed", error: message });
    appendLiveRunEvent(id, "failed", "error", `Live run failed: ${message}`);
  }
}
