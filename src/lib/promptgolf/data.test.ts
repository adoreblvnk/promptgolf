import { describe, expect, it } from "vitest";
import { challengeCategories, challenges } from "./data";

describe("challenge catalog", () => {
  it("publishes complete positive-evaluation metadata without overstating availability", () => {
    expect(challenges).toHaveLength(12);
    expect(challengeCategories).toHaveLength(6);
    expect(challenges.filter((challenge) => challenge.status === "live")).toHaveLength(1);

    for (const challenge of challenges) {
      expect(challenge.evaluation.behavior.length).toBeGreaterThan(0);
      expect(challenge.evaluation.specCompleteness).toBe("requirement tree");
      expect(challenge.evaluation.artifactAdapter).toMatch(/adapter$/);
      expect(challenge.framework).toBeTruthy();
      expect(challenge.artifact).toBeTruthy();
      if (challenge.acceptance !== undefined) {
        expect(challenge.acceptance).toBeGreaterThanOrEqual(0);
        expect(challenge.acceptance).toBeLessThanOrEqual(100);
      }
    }
  });

  it("only publishes worked contracts that belong to their challenge", () => {
    const checkout = challenges.find((challenge) => challenge.slug === "mini-checkout-promo-engine");
    expect(checkout?.workedContract).toEqual({
      given: "a shopper has cart items",
      when: "quantities or a promo change",
      then: "totals update and checkout reaches a clear confirmation state",
    });

    for (const challenge of challenges.filter((item) => item.slug !== "mini-checkout-promo-engine")) {
      expect(challenge.workedContract).toBeUndefined();
    }
  });
});
