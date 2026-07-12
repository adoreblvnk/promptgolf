import { describe, expect, it } from "vitest";
import { moneyToCents } from "./playwright-evaluator";

describe("moneyToCents", () => {
  it.each([
    ["$19.99", 1999],
    ["USD 1,234.50", 123450],
    ["-$4.5", -450],
    ["($12.34)", -1234],
    ["Total: 8", 800],
  ])("parses a single observable monetary amount from %j", (input, expected) => {
    expect(moneyToCents(input)).toBe(expected);
  });

  it.each(["", "free", "$1.999", "Subtotal $10.00 Total $12.00", "1e309"])(
    "rejects ambiguous or malformed evidence %j instead of accidentally passing it",
    (input) => expect(() => moneyToCents(input)).toThrow(/monetary amount|one monetary/),
  );
});