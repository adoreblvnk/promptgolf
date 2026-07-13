import { describe, expect, it } from "vitest";
import { challengeCategories, challenges } from "./data";

describe("challenge catalog", () => {
  it("publishes complete positive-evaluation metadata without overstating availability", () => {
    expect(challenges).toHaveLength(12);
    expect(challengeCategories).toHaveLength(6);
    expect(challenges.filter((challenge) => challenge.status === "live")).toHaveLength(1);

    const adapterByArtifact = {
      web: "web-app-adapter",
      api: "api-adapter",
      cli: "cli-adapter",
      pipeline: "pipeline-adapter",
      library: "library-adapter",
      database: "database-adapter",
    } as const;

    expect(new Set(challenges.map(({ slug }) => slug)).size).toBe(challenges.length);
    for (const challenge of challenges) {
      expect(challenge.evaluation.behavior.length).toBeGreaterThan(0);
      expect(challenge.evaluation.specCompleteness).toBe("requirement tree");
      expect(challenge.evaluation.artifactAdapter).toBe(adapterByArtifact[challenge.artifact]);
      expect(challenge.framework).toBeTruthy();
      expect(challenge.publicRequirements.length).toBeGreaterThanOrEqual(3);
      expect(challenge.hiddenTeasers.length).toBeGreaterThan(0);
      if (challenge.acceptance !== undefined) {
        expect(challenge.acceptance).toBeGreaterThanOrEqual(0);
        expect(challenge.acceptance).toBeLessThanOrEqual(100);
      }
    }
  });

  it("publishes deterministic rules for boundary-sensitive problems", () => {
    const requirements = (slug: string) => challenges.find((challenge) => challenge.slug === slug)?.publicRequirements.join(" ") ?? "";

    expect(requirements("mini-checkout-promo-engine")).toMatch(/Canvas tote[\s\S]*SAVE10[\s\S]*BIGSAVE/);
    expect(requirements("rate-limiter")).toMatch(/half-open trailing interval[\s\S]*rejected attempts do not consume capacity/);
    expect(requirements("idempotent-charge")).toMatch(/original chargeId[\s\S]*different amount rejects/);
    expect(requirements("interest-accrual")).toMatch(/Actual\/365 Fixed[\s\S]*elapsed calendar days \/ 365/);
    expect(requirements("build-a-pool-allocator")).toMatch(/returns NULL[\s\S]*later allocation can reuse/);
    expect(requirements("events-schema")).toMatch(/Prevent duplicate RSVPs[\s\S]*cascades[\s\S]*zero-attendance/);
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
