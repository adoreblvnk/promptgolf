import type { CodexModelId } from "ai-sdk-provider-codex-cli";

export const codexModelId: CodexModelId = "gpt-5.5";

export async function createDefaultCodexModel() {
  // Provider policy: Codex CLI via ai-sdk-provider-codex-cli is the default
  // model boundary because the user's ChatGPT/Codex subscription is the
  // intended unlimited path. Codex currently has no AI SDK tool-call support,
  // so any flow that needs tools must use a separate fallback adapter instead
  // of pretending Codex can call tools.
  const { codexCli } = await import("ai-sdk-provider-codex-cli");
  return codexCli(codexModelId, {
    reasoningEffort: "medium",
    sandboxMode: "read-only",
    approvalMode: "never",
  });
}

export function getModelPolicy() {
  return {
    defaultProvider: "Codex CLI",
    defaultModel: codexModelId,
    package: "ai-sdk-provider-codex-cli",
    unlimitedThrough: "ChatGPT/Codex subscription",
    separateFrom: "OpenAI provider credits",
    toolCalls: false,
    fallback: "OpenAI provider only for low-credit fallback/tool-call paths; no Google provider is used",
    liveAdapters: ["sandbox credentials", "TOKENROUTER_API_KEY", "AGNES_AI_API_KEY"],
  };
}
