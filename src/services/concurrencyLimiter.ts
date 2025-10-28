/**
 * Concurrency Limiter
 * Controls the number of concurrent operations to prevent resource exhaustion
 */

export class ConcurrencyLimiter {
  private maxConcurrency: number;
  private running: number = 0;
  private queue: Array<(value: unknown) => void> = [];

  constructor(maxConcurrency: number = 5) {
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  /**
   * Execute a function with concurrency limiting
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Wait until we have capacity
    while (this.running >= this.maxConcurrency) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.running++;

    try {
      return await fn();
    } finally {
      this.running--;

      // Process next item in queue if any
      const nextResolve = this.queue.shift();
      if (nextResolve) {
        nextResolve(undefined);
      }
    }
  }

  /**
   * Execute multiple functions with concurrency limiting
   * Returns results in same order as input functions
   */
  async runAll<T>(
    fns: Array<() => Promise<T>>
  ): Promise<PromiseSettledResult<T>[]> {
    const promises = fns.map((fn) => this.run(fn));
    return Promise.allSettled(promises);
  }

  /**
   * Execute multiple functions with concurrency limiting
   * Throws on first error
   */
  async runAllOrThrow<T>(fns: Array<() => Promise<T>>): Promise<T[]> {
    const promises = fns.map((fn) => this.run(fn));
    return Promise.all(promises);
  }

  /**
   * Get current concurrency status
   */
  getStatus(): {
    running: number;
    queued: number;
    maxConcurrency: number;
  } {
    return {
      running: this.running,
      queued: this.queue.length,
      maxConcurrency: this.maxConcurrency,
    };
  }

  /**
   * Reset the limiter
   */
  reset(): void {
    this.running = 0;
    this.queue = [];
  }
}

/**
 * Create a limiter for a specific concurrency level
 */
export function createLimiter(maxConcurrency: number = 5): ConcurrencyLimiter {
  return new ConcurrencyLimiter(maxConcurrency);
}

/**
 * Map function with concurrency control
 * Similar to Promise.all but with concurrency limits
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  maxConcurrency: number = 5
): Promise<R[]> {
  const limiter = new ConcurrencyLimiter(maxConcurrency);
  const promises = items.map((item) => limiter.run(() => fn(item)));
  return Promise.all(promises);
}

/**
 * Map function with concurrency control (settled version)
 * Similar to Promise.allSettled but with concurrency limits
 */
export async function mapWithConcurrencySettled<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  maxConcurrency: number = 5
): Promise<PromiseSettledResult<R>[]> {
  const limiter = new ConcurrencyLimiter(maxConcurrency);
  const promises = items.map((item) => limiter.run(() => fn(item)));
  return Promise.allSettled(promises);
}
