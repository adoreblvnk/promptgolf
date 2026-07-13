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
    }
  });
});
