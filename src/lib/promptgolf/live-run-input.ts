import { z } from "zod";
import { getChallenge } from "./data";
import { MAX_LIVE_PROMPT_LENGTH, MIN_LIVE_PROMPT_LENGTH } from "./live-run-limits";

export { MAX_LIVE_PROMPT_LENGTH, MIN_LIVE_PROMPT_LENGTH } from "./live-run-limits";

const liveRunInputSchema = z.object({
  prompt: z.string().trim().min(MIN_LIVE_PROMPT_LENGTH).max(MAX_LIVE_PROMPT_LENGTH),
  challengeSlug: z.string().trim().min(1).max(100),
}).strict();

export type ValidLiveRunInput = z.infer<typeof liveRunInputSchema>;

export type LiveRunInputResult =
  | { success: true; data: ValidLiveRunInput }
  | { success: false; code: "invalid-input" | "unknown-challenge" | "challenge-not-live"; message: string };

/** Validates the public run boundary before any provider or sandbox work is queued. */
export function validateLiveRunInput(input: unknown): LiveRunInputResult {
  const parsed = liveRunInputSchema.safeParse(input);
  if (!parsed.success) {
    const promptIssue = parsed.error.issues.find((issue) => issue.path[0] === "prompt");
    const message = promptIssue?.code === "too_small"
      ? `Prompt must contain at least ${MIN_LIVE_PROMPT_LENGTH} characters.`
      : promptIssue?.code === "too_big"
        ? `Prompt must contain at most ${MAX_LIVE_PROMPT_LENGTH} characters.`
        : "Prompt and challengeSlug must be valid strings.";
    return { success: false, code: "invalid-input", message };
  }

  const challenge = getChallenge(parsed.data.challengeSlug);
  if (!challenge) return { success: false, code: "unknown-challenge", message: "Challenge not found." };
  if (challenge.status !== "live") {
    return { success: false, code: "challenge-not-live", message: "This challenge is a preview and is not accepting live runs yet." };
  }
  return { success: true, data: parsed.data };
}
