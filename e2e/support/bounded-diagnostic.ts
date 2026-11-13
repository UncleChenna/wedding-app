export type Diagnostic<T> =
  { available: true; value: T } | { available: false; reason: "timeout" | "rejected" };

/** Browser metadata is supplemental; a stalled protocol call must not block the wire budget. */
export async function boundedDiagnostic<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<Diagnostic<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise.then(
        (value): Diagnostic<T> => ({ available: true, value }),
        (): Diagnostic<T> => ({ available: false, reason: "rejected" }),
      ),
      new Promise<Diagnostic<T>>((resolve) => {
        timer = setTimeout(() => resolve({ available: false, reason: "timeout" }), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
