import { redactSecrets } from "./redact-secrets";
import { boundedEnvNumber } from "./env-number";
import { readBoundedResponseText } from "./provider-response";

export type ProviderMode = "default" | "live" | "unavailable" | "degraded" | "fallback";

export type ProviderStatus = {
  name: string;
  role: string;
  mode: ProviderMode;
  model?: string;
  detail: string;
};

export type ProviderProbe = ProviderStatus & {
  status: "connected" | "unavailable" | "degraded";
  latencyMs?: number;
  output?: string;
};

const DAYTONA_BASE_URL = process.env.DAYTONA_API_BASE_URL ?? "https://app.daytona.io/api";
const MOONSHOT_BASE_URL = process.env.MOONSHOT_BASE_URL ?? "https://api.moonshot.ai/v1";
const MOONSHOT_MODEL = process.env.MOONSHOT_MODEL ?? "kimi-k2.6";
const MOONSHOT_TEMPERATURE = 0.6;
const PROVIDER_TIMEOUT_MS = boundedEnvNumber(process.env.PROMPTGOLF_PROVIDER_TIMEOUT_MS, 12_000, {
  min: 1_000,
  max: 60_000,
  integer: true,
});
const PROVIDER_MAX_TOKENS = boundedEnvNumber(process.env.PROMPTGOLF_PROVIDER_MAX_TOKENS, 80, {
  min: 16,
  max: 1_024,
  integer: true,
});

function hasKey(name: string) {
  return Boolean(process.env[name]?.trim());
}

function testProviderStubsEnabled() {
  return process.env.PROMPTGOLF_TEST_PROVIDER_STUBS === "1";
}

function started() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function elapsedMs(start: number) {
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  return Math.max(0, Math.round(now - start));
}

function sanitizeError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  return redactSecrets(raw, 240);
}

function abortAfter(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function extractProviderError(data: unknown) {
  if (typeof data === "object" && data !== null) {
    const maybeError = "error" in data ? data.error : undefined;
    if (typeof maybeError === "object" && maybeError !== null && "message" in maybeError) {
      return String(maybeError.message);
    }
    if ("message" in data) {
      return String(data.message);
    }
  }

  return undefined;
}

function extractChatText(data: unknown) {
  if (typeof data !== "object" || data === null || !("choices" in data) || !Array.isArray(data.choices)) {
    return "";
  }

  const [firstChoice] = data.choices;
  if (typeof firstChoice !== "object" || firstChoice === null || !("message" in firstChoice)) {
    return "";
  }

  const message = firstChoice.message;
  if (typeof message !== "object" || message === null || !("content" in message)) {
    return "";
  }

  const content = message.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part === "object" && part !== null && "text" in part) return String(part.text);
        return "";
      })
      .join("\n");
  }

  return "";
}

async function generateRawOpenAICompatibleText({
  apiKey,
  baseUrl,
  model,
  system,
  prompt,
  signal,
  extraBody,
}: {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  prompt: string;
  signal: AbortSignal;
  extraBody?: Record<string, unknown>;
}) {
  const response = await fetch(joinUrl(baseUrl, "/chat/completions"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: PROVIDER_MAX_TOKENS,
      temperature: MOONSHOT_TEMPERATURE,
      stream: false,
      ...extraBody,
    }),
    signal,
  });

  const rawBody = await readBoundedResponseText(response);
  let data: unknown;
  try {
    data = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const message = extractProviderError(data) ?? rawBody.slice(0, 160) ?? response.statusText;
    throw new Error(`HTTP ${response.status}: ${sanitizeError(message)}`);
  }

  const text = extractChatText(data).trim();
  if (!text) {
    throw new Error("provider returned no message content");
  }

  return text;
}

function configuredStatus(name: string, role: string, envName: string, liveDetail: string, unavailableDetail: string, model?: string): ProviderStatus {
  return hasKey(envName)
    ? { name, role, mode: "live", model, detail: liveDetail }
    : { name, role, mode: "unavailable", model, detail: unavailableDetail };
}

export function getDaytonaAdapterStatus(): ProviderStatus {
  return configuredStatus(
    "Sandbox",
    "sandbox runner",
    "DAYTONA_API_KEY",
    "Live sandbox API credentials are configured. PromptGolf probes connectivity before reporting run infrastructure state.",
    "Sandbox credentials are not configured, so sandbox execution is marked unavailable instead of simulated.",
  );
}

export function getMoonshotAdapterStatus(): ProviderStatus {
  return configuredStatus(
    "Moonshot AI",
    "live workspace builder + evaluator",
    "MOONSHOT_API_KEY",
    "Moonshot credentials are configured for evaluator drafts, prompt feedback, visual evaluation, and diagnosis.",
    "MOONSHOT_API_KEY is not configured, so live model generation and evaluation are unavailable.",
    MOONSHOT_MODEL,
  );
}

export function getProviderStatuses(): ProviderStatus[] {
  return [
    {
      name: "Codex CLI",
      role: "builder-agent boundary",
      mode: "default",
      model: "gpt-5.5",
      detail:
        "Default CLI/process model boundary through ai-sdk-provider-codex-cli. Codex is not used for AI SDK tool calls.",
    },
    getDaytonaAdapterStatus(),
    getMoonshotAdapterStatus(),
  ];
}

export const providerStatuses = getProviderStatuses();

export async function probeDaytonaStatus(): Promise<ProviderProbe> {
  const base = getDaytonaAdapterStatus();
  const key = process.env.DAYTONA_API_KEY?.trim();

  if (!key) {
    return { ...base, status: "unavailable" };
  }

  if (testProviderStubsEnabled()) {
    return {
      ...base,
      status: "connected",
      latencyMs: 1,
      output: "Stubbed CI probe: sandbox API credential accepted at adapter boundary.",
    };
  }

  const start = started();
  const { controller, timeout } = abortAfter(PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(joinUrl(DAYTONA_BASE_URL, "/sandbox/paginated?page=1&limit=1"), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ...base,
        mode: "degraded",
        status: "degraded",
        latencyMs: elapsedMs(start),
        detail: `Credentialed sandbox probe returned HTTP ${response.status}; run infrastructure is degraded, not simulated.`,
      };
    }

    return {
      ...base,
      status: "connected",
      latencyMs: elapsedMs(start),
      output: "Credentialed sandbox list probe succeeded; destructive sandbox creation remains disabled until endpoint options are confirmed per run.",
    };
  } catch (error) {
    return {
      ...base,
      mode: "degraded",
      status: "degraded",
      latencyMs: elapsedMs(start),
      detail: `Credentialed sandbox probe failed: ${sanitizeError(error)}. Run infrastructure is degraded, not simulated.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateMoonshotPromptFeedback(
  prompt: string,
  options: { system?: string; userPrompt?: string } = {},
): Promise<ProviderProbe> {
  const base = getMoonshotAdapterStatus();
  const apiKey = process.env.MOONSHOT_API_KEY?.trim();

  if (!apiKey) {
    return { ...base, status: "unavailable" };
  }

  if (testProviderStubsEnabled()) {
    return {
      ...base,
      status: "connected",
      latencyMs: 1,
      output: "Moonshot feedback: this prompt is classified against checkout edge-case coverage.",
    };
  }

  const start = started();
  const { controller, timeout } = abortAfter(PROVIDER_TIMEOUT_MS);

  try {
    const text = await generateRawOpenAICompatibleText({
      apiKey,
      baseUrl: MOONSHOT_BASE_URL,
      model: MOONSHOT_MODEL,
      signal: controller.signal,
      system:
        options.system ??
        "You are PromptGolf's concise evaluator. Give one sentence of prompt-quality feedback. Do not reveal hidden test answers beyond broad categories.",
      prompt: options.userPrompt ?? `Evaluate this ecommerce checkout challenge prompt in one sentence (max 35 words):\n\n${prompt.slice(0, 1600)}`,
    });

    return {
      ...base,
      status: "connected",
      latencyMs: elapsedMs(start),
      output: text.trim().slice(0, 280),
    };
  } catch (error) {
    return {
      ...base,
      mode: "degraded",
      status: "degraded",
      latencyMs: elapsedMs(start),
      detail: `Moonshot model call failed: ${sanitizeError(error)}. Feedback is reported as degraded.`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectRunProviderState(prompt: string): Promise<ProviderProbe[]> {
  return Promise.all([
    probeDaytonaStatus(),
    generateMoonshotPromptFeedback(prompt),
  ]);
}

export async function generateLiveTestDrafts(specs: Array<{ title?: unknown }>) {
  const source = specs.length
    ? specs.map((spec, index) => `${index + 1}. ${String(spec.title ?? `Spec ${index + 1}`)}`).join("\n")
    : "1. Promo codes trim and match case-insensitively\n2. Checkout locks while submitting";

  const moonshot = await generateMoonshotPromptFeedback(
    `Create two concise Playwright test titles for these checkout specs. Return plain lines only.\n${source}`,
    {
      system: "You generate concise Playwright test titles for PromptGolf. Return plain lines only; no prose or numbering.",
      userPrompt: `Create two concise Playwright test titles for these checkout specs. Return plain lines only.\n${source}`,
    },
  );

  if (moonshot.status === "connected" && moonshot.output) {
    return {
      provider: moonshot,
      tests: moonshot.output
        .split(/\n+/)
        .map((line) => line.replace(/^[-*\d.)\s]+/, "").trim())
        .filter(Boolean)
        .slice(0, 4)
        .map((title, index) => ({ id: `moonshot-generated-${index + 1}`, title, code: "// Drafted through Moonshot from stable natural-language specs; deterministic Playwright materializes and scores checks separately." })),
    };
  }

  return {
    provider: moonshot,
    tests: [],
  };
}
