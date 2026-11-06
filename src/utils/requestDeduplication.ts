interface PendingRequest {
  promise: Promise<unknown>;
  controller: AbortController;
  subscribers: number;
}

/** Instance-local sharing. One cancelled subscriber must not cancel another. */
export class RequestDeduplicator {
  private pending = new Map<string, PendingRequest>();

  deduplicate<T>(key: string, fn: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
    if (signal?.aborted) return Promise.reject(signal.reason);
    let entry = this.pending.get(key);
    if (!entry) {
      const controller = new AbortController();
      const created: PendingRequest = { controller, subscribers: 0, promise: Promise.resolve() };
      created.promise = Promise.resolve()
        .then(() => {
          controller.signal.throwIfAborted();
          return fn(controller.signal);
        })
        .finally(() => {
          if (this.pending.get(key) === created) this.pending.delete(key);
        });
      entry = created;
      this.pending.set(key, entry);
    }
    entry.subscribers++;
    const current = entry;
    const promise = current.promise as Promise<T>;
    if (!signal) return promise;
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const finish = (callback: () => void) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        current.subscribers--;
        callback();
      };
      const abort = () =>
        finish(() => {
          if (current.subscribers === 0) {
            if (this.pending.get(key) === current) this.pending.delete(key);
            current.controller.abort(signal.reason);
          }
          reject(signal.reason);
        });
      signal.addEventListener('abort', abort, { once: true });
      promise.then(
        value => finish(() => resolve(value)),
        error => finish(() => reject(error))
      );
      if (signal.aborted) abort();
    });
  }

  get size(): number {
    return this.pending.size;
  }
  clear() {
    for (const request of this.pending.values()) request.controller.abort();
    this.pending.clear();
  }
}
export const requestDeduplicator = new RequestDeduplicator();
