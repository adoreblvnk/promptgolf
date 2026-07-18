import { generateText } from "ai";
import { openai, type OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { checkoutEvaluatorSpecs } from "./evaluator-specs";
import { boundedEnvNumber } from "./env-number";
import { DOUBLEWORD_DIAGNOSIS_MODEL, OPENAI_BUILDER_MODEL } from "./model";
import { redactSecrets } from "./redact-secrets";

export type ProviderMode = "live" | "unavailable" | "degraded" | "stored" | "stubbed";

export type ProviderStatus = {
  name: string;
  role: string;
  mode: ProviderMode;
  model?: string;
  detail: string;
};

export type ProviderProbe = ProviderStatus & {
  status: "pending" | "connected" | "unavailable" | "degraded";
  latencyMs?: number;
  output?: string;
};

const PROVIDER_TIMEOUT_MS = boundedEnvNumber(process.env.PROMPTGOLF_PROVIDER_TIMEOUT_MS, 12_000, {
  min: 1_000,
  max: 60_000,
  integer: true,
});
const PROVIDER_MAX_OUTPUT_TOKENS = boundedEnvNumber(process.env.PROMPTGOLF_PROVIDER_MAX_OUTPUT_TOKENS, 80, {
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

export function getDaytonaAdapterStatus(): ProviderStatus {
  return hasKey("DAYTONA_API_KEY")
    ? {
        name: "Daytona",
        role: "sandbox runner",
        mode: "live",
        detail: "DAYTONA_API_KEY is configured. Live runs create isolated Daytona sandboxes for build, start, health, and preview verification.",
      }
    : {
        name: "Daytona",
        role: "sandbox runner",
        mode: "unavailable",
        detail: "DAYTONA_API_KEY is not configured, so live sandbox execution fails honestly instead of using a local substitute.",
      };
}

export function getOpenAIAdapterStatus(): ProviderStatus {
  return hasKey("OPENAI_API_KEY")
    ? {
        name: "OpenAI",
        role: "builder + visual judge",
        mode: "live",
        model: OPENAI_BUILDER_MODEL,
        detail: "OPENAI_API_KEY is configured. PromptGolf uses @ai-sdk/openai for the live builder and screenshot judge.",
      }
    : {
        name: "OpenAI",
        role: "builder + visual judge",
        mode: "unavailable",
        model: OPENAI_BUILDER_MODEL,
        detail: "OPENAI_API_KEY is not configured, so live model calls are unavailable and runs fail honestly.",
      };
}

export function getDoublewordAdapterStatus(): ProviderStatus {
  return hasKey("DOUBLEWORD_API_KEY")
    ? {
        name: "Doubleword",
        role: "post-score prompt diagnosis",
        mode: "live",
        model: DOUBLEWORD_DIAGNOSIS_MODEL,
        detail: "DOUBLEWORD_API_KEY is configured. PromptGolf uses the official @doubleword/vercel-ai provider for structured diagnosis after the deterministic score is locked.",
      }
    : {
        name: "Doubleword",
        role: "post-score prompt diagnosis",
        mode: "unavailable",
        model: DOUBLEWORD_DIAGNOSIS_MODEL,
        detail: "DOUBLEWORD_API_KEY is not configured, so prompt diagnosis reports a degraded state without changing the score.",
      };
}

export function getStoredEvalSpecStatus(): ProviderStatus {
  return {
    name: "Stored EvalSpecs",
    role: "validated behavior specification",
    mode: "stored",
    detail: "Contestant runs use checked-in, validated EvalSpecs. Offline GPT-5.5 review may author or review specs outside the run path.",
  };
}

export function getProviderStatuses(): ProviderStatus[] {
  return [getOpenAIAdapterStatus(), getDaytonaAdapterStatus(), getDoublewordAdapterStatus(), getStoredEvalSpecStatus()];
}

export const providerStatuses = getProviderStatuses();

export async function probeDaytonaStatus(): Promise<ProviderProbe> {
  const base = getDaytonaAdapterStatus();

  if (!hasKey("DAYTONA_API_KEY")) {
    return { ...base, status: "unavailable" };
  }

  if (testProviderStubsEnabled()) {
    return {
      ...base,
      status: "connected",
      mode: "live",
      latencyMs: 1,
      output: "Stubbed CI probe: Daytona SDK boundary accepted at adapter level.",
    };
  }

  const start = started();
  try {
    const { Daytona } = await import("@daytonaio/sdk");
    const daytona = new Daytona();
    const iterator = daytona.list({ limit: 1 });
    await Promise.race([
      iterator.next(),
      new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("Daytona SDK probe timed out")), PROVIDER_TIMEOUT_MS)),
    ]);
    return {
      ...base,
      status: "connected",
      latencyMs: elapsedMs(start),
      output: "Credentialed Daytona SDK list probe succeeded; live runs still create a fresh sandbox per submission.",
    };
  } catch (error) {
    return {
      ...base,
      mode: "degraded",
      status: "degraded",
      latencyMs: elapsedMs(start),
      detail: `Credentialed Daytona SDK probe failed: ${sanitizeError(error)}. Sandbox execution is degraded, not simulated.`,
    };
  }
}

export async function generateOpenAIPromptFeedback(
  prompt: string,
  options: { system?: string; userPrompt?: string } = {},
): Promise<ProviderProbe> {
  const base = getOpenAIAdapterStatus();

  if (!hasKey("OPENAI_API_KEY")) {
    return { ...base, status: "unavailable" };
  }

  if (testProviderStubsEnabled()) {
    return {
      ...base,
      status: "connected",
      latencyMs: 1,
      output: "OpenAI feedback: this prompt is classified against checkout edge-case coverage.",
    };
  }

  const start = started();
  try {
    const result = await generateText({
      model: openai.responses(OPENAI_BUILDER_MODEL),
      system:
        options.system ??
        "You are PromptGolf's concise evaluator. Give one sentence of prompt-quality feedback. Do not reveal hidden test answers beyond broad categories.",
      prompt: options.userPrompt ?? `Evaluate this ecommerce checkout challenge prompt in one sentence (max 35 words):\n\n${prompt.slice(0, 1600)}`,
      maxOutputTokens: PROVIDER_MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      timeout: PROVIDER_TIMEOUT_MS,
      providerOptions: {
        openai: {
          reasoningEffort: "low",
          textVerbosity: "low",
        } satisfies OpenAIResponsesProviderOptions,
      },
    });
    const text = result.text.trim();
    if (!text) throw new Error("OpenAI returned no message content");
    return {
      ...base,
      status: "connected",
      latencyMs: elapsedMs(start),
      output: text.slice(0, 280),
    };
  } catch (error) {
    return {
      ...base,
      mode: "degraded",
      status: "degraded",
      latencyMs: elapsedMs(start),
      detail: `OpenAI AI SDK call failed: ${sanitizeError(error)}. Feedback is reported as degraded.`,
    };
  }
}

export async function collectRunProviderState(prompt: string): Promise<ProviderProbe[]> {
  return Promise.all([
    probeDaytonaStatus(),
    generateOpenAIPromptFeedback(prompt),
    Promise.resolve({ ...getDoublewordAdapterStatus(), status: hasKey("DOUBLEWORD_API_KEY") ? "pending" as const : "unavailable" as const }),
    Promise.resolve({ ...getStoredEvalSpecStatus(), status: "connected" as const }),
  ]);
}

type StoredDraftSource = { title?: unknown; label?: unknown; intent?: unknown };

export function getStoredLiveTestDrafts(specs: StoredDraftSource[] = checkoutEvaluatorSpecs) {
  const tests: StoredDraftSource[] = specs.length ? specs : checkoutEvaluatorSpecs;
  return {
    provider: { ...getStoredEvalSpecStatus(), status: "connected" as const },
    tests: tests.map((spec, index) => ({
      id: `stored-evalspec-${index + 1}`,
      title: String(spec.title ?? (spec.label && spec.intent ? `${spec.label}: ${spec.intent}` : spec.label) ?? `Spec ${index + 1}`),
      code: "// Stored PromptGolf EvalSpec; deterministic Playwright materializes and scores checks during live runs.",
    })),
  };
}

export const generateLiveTestDrafts = getStoredLiveTestDrafts;
