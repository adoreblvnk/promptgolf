import { describe, expect, it } from "vitest";
import { boundedEnvNumber } from "./env-number";

describe("bounded numeric environment settings", () => {
  const bounds = { min: 1, max: 100, integer: true };

  it("accepts an in-range configured integer", () => {
    expect(boundedEnvNumber("42", 10, bounds)).toBe(42);
  });

  it.each([undefined, "", "not-a-number", "Infinity", "0", "101", "1.5"])(
    "uses the safe fallback for %s",
    (value) => {
      expect(boundedEnvNumber(value, 10, bounds)).toBe(10);
    },
  );

  it("supports bounded finite decimal settings when integers are not required", () => {
    expect(boundedEnvNumber("0.25", 1, { min: 0.1, max: 2 })).toBe(0.25);
  });
});
