import { describe, expect, it } from "vitest";
import { MAX_LIVE_PROMPT_LENGTH, validateLiveRunInput } from "./live-run-input";

const liveChallenge = "mini-checkout-promo-engine";

describe("validateLiveRunInput", () => {
  it("normalizes valid input before provider work", () => {
    expect(validateLiveRunInput({ prompt: "  Build a robust checkout.  ", challengeSlug: ` ${liveChallenge} ` })).toEqual({
      success: true,
      data: { prompt: "Build a robust checkout.", challengeSlug: liveChallenge },
    });
  });

  it("rejects malformed and oversized prompts", () => {
    expect(validateLiveRunInput({ prompt: 42, challengeSlug: liveChallenge })).toMatchObject({ success: false, code: "invalid-input" });
    expect(validateLiveRunInput({ prompt: "x".repeat(MAX_LIVE_PROMPT_LENGTH + 1), challengeSlug: liveChallenge })).toMatchObject({ success: false, code: "invalid-input" });
  });

  it("rejects unknown and preview-only challenges", () => {
    expect(validateLiveRunInput({ prompt: "Build a robust checkout.", challengeSlug: "missing" })).toMatchObject({ success: false, code: "unknown-challenge" });
    expect(validateLiveRunInput({ prompt: "Build a robust team workflow.", challengeSlug: "team-invites-role-management" })).toMatchObject({ success: false, code: "challenge-not-live" });
  });

  it("rejects unrecognized fields at the API boundary", () => {
    expect(validateLiveRunInput({ prompt: "Build a robust checkout.", challengeSlug: liveChallenge, origin: "https://attacker.invalid" })).toMatchObject({ success: false, code: "invalid-input" });
  });
});