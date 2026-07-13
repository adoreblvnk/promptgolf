import { describe, expect, it } from "vitest";
import { meetsMinimumSpecLength } from "./spec-validation";

describe("spec editor length check", () => {
  it("counts non-whitespace prompt content", () => {
    expect(meetsMinimumSpecLength("                    ")).toBe(false);
    expect(meetsMinimumSpecLength("Build a checkout with totals.")).toBe(true);
  });

  it("supports an explicit minimum", () => {
    expect(meetsMinimumSpecLength("abcd", 5)).toBe(false);
    expect(meetsMinimumSpecLength("abcde", 5)).toBe(true);
  });
});