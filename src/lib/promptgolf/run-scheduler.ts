export type RunJob = () => Promise<void>;

export class RunQueueFullError extends Error {
  constructor() {
    super("Live run queue is at capacity. Try again after an in-flight run finishes.");
    this.name = "RunQueueFullError";
  }
}

/**
 * Small process-local FIFO scheduler for expensive provider/sandbox runs.
 * Jobs handle their own domain failures; the scheduler always releases a slot.
 */
export class RunScheduler {
  private readonly queue: RunJob[] = [];
  private active = 0;

  constructor(private readonly concurrency: number, private readonly maxQueued = 20) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error("RunScheduler concurrency must be a positive integer");
    }
    if (!Number.isInteger(maxQueued) || maxQueued < 0) {
      throw new Error("RunScheduler queue capacity must be a non-negative integer");
    }
  }

  enqueue(job: RunJob) {
    if (this.active >= this.concurrency && this.queue.length >= this.maxQueued) {
      throw new RunQueueFullError();
    }
    this.queue.push(job);
    this.drain();
  }

  snapshot() {
    return { active: this.active, queued: this.queue.length };
  }

  private drain() {
    while (this.active < this.concurrency) {
      const job = this.queue.shift();
      if (!job) return;
      this.active += 1;
      void job()
        .catch(() => undefined)
        .finally(() => {
          this.active -= 1;
          this.drain();
        });
    }
  }
}
