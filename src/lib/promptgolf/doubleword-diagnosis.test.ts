import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const close = vi.fn(async () => undefined);
  const provider = Object.assign((model: string) => `model:${model}`, { close });
  return {
    close,
    createDoublewordAsync: vi.fn(() => provider),
    generateObject: vi.fn(async () => ({
      object: {
        verdict: "balanced",
        promptingScore: 7,
        technicalScore: 6,
        summary: "The prompt is specific but misses a few observable boundaries.",
        promptingFeedback: "Keep acceptance criteria explicit.",
        technicalFeedback: "Cover the remaining product edge cases.",
      },
    })),
  };
});

vi.mock("@doubleword/vercel-ai", () => ({ createDoublewordAsync: mocks.createDoublewordAsync }));
vi.mock("ai", () => ({ generateObject: mocks.generateObject }));

import { generateDoublewordDiagnosis } from "./doubleword-diagnosis";
import { DOUBLEWORD_DIAGNOSIS_MODEL } from "./model";

describe("Doubleword async diagnosis provider", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses the async tier with the configured model and always closes the provider", async () => {
    await expect(generateDoublewordDiagnosis({ system: "Diagnose", prompt: "Prompt and score" })).resolves.toMatchObject({
      verdict: "balanced",
    });

    expect(DOUBLEWORD_DIAGNOSIS_MODEL).toBe("Qwen/Qwen3-VL-30B-A3B-Instruct-FP8");
    expect(mocks.createDoublewordAsync).toHaveBeenCalledWith({
      batchSize: 1,
      batchWindowSeconds: 1,
      pollIntervalSeconds: 2,
    });
    expect(mocks.generateObject).toHaveBeenCalledWith(expect.objectContaining({
      model: `model:${DOUBLEWORD_DIAGNOSIS_MODEL}`,
      maxOutputTokens: 700,
      maxRetries: 0,
    }));
    expect(mocks.close).toHaveBeenCalledOnce();
  });

  it("closes the async provider when generation fails", async () => {
    mocks.generateObject.mockRejectedValueOnce(new Error("provider failed"));

    await expect(generateDoublewordDiagnosis({ system: "Diagnose", prompt: "Prompt and score" })).rejects.toThrow("provider failed");
    expect(mocks.close).toHaveBeenCalledOnce();
  });
});
