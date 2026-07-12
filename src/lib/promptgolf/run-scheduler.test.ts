import { describe, expect, it } from "vitest";
import { RunScheduler } from "./run-scheduler";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("RunScheduler", () => {
  it("runs expensive jobs FIFO within its concurrency bound", async () => {
    const scheduler = new RunScheduler(2);
    const gates = [deferred(), deferred(), deferred()];
    const started: number[] = [];

    gates.forEach((gate, index) => scheduler.enqueue(async () => {
      started.push(index);
      await gate.promise;
    }));

    expect(started).toEqual([0, 1]);
    expect(scheduler.snapshot()).toEqual({ active: 2, queued: 1 });

    gates[0].resolve();
    await settle();
    expect(started).toEqual([0, 1, 2]);
    expect(scheduler.snapshot()).toEqual({ active: 2, queued: 0 });

    gates[1].resolve();
    gates[2].resolve();
    await settle();
    expect(scheduler.snapshot()).toEqual({ active: 0, queued: 0 });
  });

  it("releases a slot when a job rejects", async () => {
    const scheduler = new RunScheduler(1);
    const started: string[] = [];

    scheduler.enqueue(async () => {
      started.push("failed");
      throw new Error("expected failure");
    });
    scheduler.enqueue(async () => {
      started.push("next");
    });

    await settle();
    await settle();
    expect(started).toEqual(["failed", "next"]);
    expect(scheduler.snapshot()).toEqual({ active: 0, queued: 0 });
  });

  it("rejects invalid concurrency", () => {
    expect(() => new RunScheduler(0)).toThrow("positive integer");
  });
});
