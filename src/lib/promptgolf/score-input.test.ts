import { describe, expect, it } from "vitest";
import { validateScoreInput } from "./score-input";

const validTest = {
  id: "subtotal",
  label: "Computes subtotal",
  category: "public" as const,
  passed: true,
  note: "Observed expected total.",
};

describe("validateScoreInput", () => {
  it("accepts bounded results and supplies optional scoring defaults", () => {
    expect(validateScoreInput({ tests: [validTest] })).toEqual({
      success: true,
      data: { tests: [validTest], uxScore: 7, promptCount: 1 },
    });
  });

  it("rejects non-finite and out-of-range scoring values", () => {
    expect(validateScoreInput({ tests: [], uxScore: Number.NaN })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: [], uxScore: 11 })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: [], promptCount: 0 })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: [], promptCount: 1.5 })).toMatchObject({ success: false });
  });

  it("rejects malformed, oversized, and property-injected result collections", () => {
    expect(validateScoreInput({ tests: [{ ...validTest, passed: "yes" }] })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: Array.from({ length: 201 }, (_, index) => ({ ...validTest, id: String(index) })) })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: [{ ...validTest, implementationFingerprint: "react" }] })).toMatchObject({ success: false });
    expect(validateScoreInput({ tests: [], admin: true })).toMatchObject({ success: false });
  });
});
