import { describe, expect, it } from "vitest";
import { appendLiveRunEvent, createLiveRun, getLiveRun } from "./live-run-store";

describe("process-local live run store bounds", () => {
  it("uses unguessable run identifiers and evicts the oldest run at capacity", () => {
    const runs = Array.from({ length: 101 }, (_, index) => createLiveRun({
      prompt: `bounded prompt ${index}`,
      challengeSlug: "mini-checkout-promo-engine",
    }));

    expect(runs[0].id).toMatch(/^live-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(getLiveRun(runs[0].id)).toBeUndefined();
    expect(getLiveRun(runs.at(-1)!.id)).toBeDefined();
  });

  it("retains only the newest 200 events with monotonic identifiers", () => {
    const run = createLiveRun({ prompt: "event bound", challengeSlug: "mini-checkout-promo-engine" });
    for (let index = 0; index < 205; index += 1) {
      appendLiveRunEvent(run.id, "test", "info", `event ${index}`);
    }

    expect(run.events).toHaveLength(200);
    expect(run.events[0].id).toBe(7);
    expect(run.events.at(-1)?.id).toBe(206);
  });
});
