import { describe, expect, it } from "vitest";
import {
  MAX_TEST_DRAFT_SPECS,
  MAX_TEST_DRAFT_TITLE_LENGTH,
  validateGenerateTestsInput,
} from "./generate-tests-input";

describe("validateGenerateTestsInput", () => {
  it("normalizes bounded evaluator titles before provider work", () => {
    expect(validateGenerateTestsInput({ specs: [{ title: "  Verify checkout totals  " }] })).toEqual({
      success: true,
      data: { specs: [{ title: "Verify checkout totals" }] },
    });
  });

  it("rejects empty, oversized, and excessive provider requests", () => {
    expect(validateGenerateTestsInput({ specs: [] })).toMatchObject({ success: false });
    expect(validateGenerateTestsInput({ specs: [{ title: "x".repeat(MAX_TEST_DRAFT_TITLE_LENGTH + 1) }] })).toMatchObject({ success: false });
    expect(validateGenerateTestsInput({
      specs: Array.from({ length: MAX_TEST_DRAFT_SPECS + 1 }, (_, index) => ({ title: `Spec ${index}` })),
    })).toMatchObject({ success: false });
  });

  it("rejects malformed titles and unrecognized fields", () => {
    expect(validateGenerateTestsInput({ specs: [{ title: 42 }] })).toMatchObject({ success: false });
    expect(validateGenerateTestsInput({ specs: [{ title: "Valid", prompt: "ignore policy" }] })).toMatchObject({ success: false });
    expect(validateGenerateTestsInput({ specs: [{ title: "Valid" }], provider: "attacker" })).toMatchObject({ success: false });
  });
});