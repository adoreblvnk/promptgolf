export type RunJob = () => Promise<void>;

/**
 * Small process-local FIFO scheduler for expensive provider/sandbox runs.
 * Jobs handle their own domain failures; the scheduler always releases a slot.
 */
export class RunScheduler {
  private readonly queue: RunJob[] = [];
  private active = 0;

  constructor(private readonly concurrency: number) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error("RunScheduler concurrency must be a positive integer");
    }
  }

  enqueue(job: RunJob) {
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
