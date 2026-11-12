/** Short-lived, single-flight dependency check. A timed-out query is not multiplied by polling. */
export function createHealthProbe<T>(query: () => Promise<T>, timeoutMs = 2000, ttlMs = 5000) {
  let current: Promise<T | null> | undefined;
  let running = false;
  let started = 0;
  return () => {
    if (current && (running || Date.now() - started < ttlMs)) return current;
    started = Date.now();
    running = true;
    current = new Promise<T | null>((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      Promise.resolve()
        .then(query)
        .then(resolve, () => resolve(null))
        .finally(() => {
          clearTimeout(timer);
          running = false;
        });
    });
    return current;
  };
}
