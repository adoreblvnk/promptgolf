import { describe, expect, it } from "vitest";
import { appendLiveRunEvent, createLiveRun, deleteLiveRun, getLiveRun, MAX_EVENT_MESSAGE_CHARS, subscribeToLiveRun, updateLiveRun } from "./live-run-store";

describe("process-local live run store bounds", () => {
  it("uses unguessable run identifiers and evicts the oldest terminal run at capacity", () => {
    const runs = Array.from({ length: 101 }, (_, index) => {
      const run = createLiveRun({ prompt: `bounded prompt ${index}`, challengeSlug: "mini-checkout-promo-engine" });
      updateLiveRun(run.id, { status: "completed" });
      return run;
    });

    expect(runs[0].id).toMatch(/^live-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(getLiveRun(runs[0].id)).toBeUndefined();
    expect(getLiveRun(runs.at(-1)!.id)).toBeDefined();
    runs.forEach((run) => deleteLiveRun(run.id));
  });

  it("never evicts queued or running evaluations to admit a new run", () => {
    const runs = Array.from({ length: 100 }, (_, index) => createLiveRun({
      prompt: `active prompt ${index}`,
      challengeSlug: "mini-checkout-promo-engine",
    }));
    updateLiveRun(runs[0].id, { status: "running" });

    expect(() => createLiveRun({ prompt: "overflow", challengeSlug: "mini-checkout-promo-engine" })).toThrow(/capacity with active evaluations/i);
    expect(getLiveRun(runs[0].id)?.status).toBe("running");
    expect(getLiveRun(runs.at(-1)!.id)).toBeDefined();
    runs.forEach((run) => deleteLiveRun(run.id));
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

  it("bounds stored and broadcast event messages after redaction", () => {
    const run = createLiveRun({ prompt: "message bound", challengeSlug: "mini-checkout-promo-engine" });
    let broadcastMessage = "";
    const unsubscribe = subscribeToLiveRun(run.id, (event) => {
      broadcastMessage = event.message;
    });

    appendLiveRunEvent(run.id, "generate", "error", `token=sk-${"a".repeat(40)} ${"x".repeat(MAX_EVENT_MESSAGE_CHARS * 2)}`);
    unsubscribe();

    const storedMessage = run.events.at(-1)?.message ?? "";
    expect(storedMessage).toHaveLength(MAX_EVENT_MESSAGE_CHARS);
    expect(storedMessage).toMatch(/…$/);
    expect(storedMessage).not.toContain("sk-");
    expect(broadcastMessage).toBe(storedMessage);
  });

  it("bounds event-stream subscribers and releases capacity on unsubscribe", () => {
    const run = createLiveRun({ prompt: "subscriber bound", challengeSlug: "mini-checkout-promo-engine" });
    const unsubscribers = Array.from({ length: 25 }, () => subscribeToLiveRun(run.id, () => undefined));

    expect(() => subscribeToLiveRun(run.id, () => undefined)).toThrow(/too many event-stream viewers/i);
    unsubscribers[0]();
    const releaseReplacement = subscribeToLiveRun(run.id, () => undefined);
    unsubscribers.slice(1).forEach((unsubscribe) => unsubscribe());
    releaseReplacement();
  });

  it("bounds event-stream subscribers across all runs", () => {
    const unsubscribers = Array.from({ length: 4 }, (_, runIndex) => {
      const run = createLiveRun({ prompt: `global subscribers ${runIndex}`, challengeSlug: "mini-checkout-promo-engine" });
      return Array.from({ length: 25 }, () => subscribeToLiveRun(run.id, () => undefined));
    }).flat();
    const overflowRun = createLiveRun({ prompt: "global subscriber overflow", challengeSlug: "mini-checkout-promo-engine" });

    expect(() => subscribeToLiveRun(overflowRun.id, () => undefined)).toThrow(/service is at capacity/i);
    unsubscribers[0]();
    const releaseReplacement = subscribeToLiveRun(overflowRun.id, () => undefined);

    unsubscribers.slice(1).forEach((unsubscribe) => unsubscribe());
    releaseReplacement();
  });
});
