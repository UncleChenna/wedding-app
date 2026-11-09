export type ScannerMessage =
  | "SAVE_SCANNER"
  | "SCANNER_STATUS"
  | "INVALIDATE_SCANNER"
  | "READ_GUEST_SNAPSHOT"
  | "REFRESH_GUEST_SNAPSHOT";

/** Bounded, request-local channel; never send authorization or guest data from the window. */
export function scannerWorkerMessage(type: ScannerMessage, session?: string): Promise<unknown> {
  return new Promise((resolve) => {
    const controller = navigator.serviceWorker?.controller;
    if (!controller) return resolve({ state: "unavailable" });
    const channel = new MessageChannel();
    let settled = false;
    const finish = (value: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timer = setTimeout(() => finish({ state: "unavailable" }), 15_000);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => finish(event.data);
    channel.port1.onmessageerror = () => finish({ state: "unavailable" });
    try {
      controller.postMessage({ type, ...(session ? { session } : {}) }, [channel.port2]);
    } catch {
      finish({ state: "unavailable" });
    }
  });
}

export function scannerReady(value: unknown): value is {
  state: "ready";
  session: string;
  build: string;
  expiresAt: number;
} {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Record<string, unknown>;
  return (
    result.state === "ready" &&
    typeof result.session === "string" &&
    /^[a-f0-9]{64}$/.test(result.session) &&
    typeof result.build === "string" &&
    /^[a-f0-9]{64}$/.test(result.build) &&
    typeof result.expiresAt === "number" &&
    Number.isSafeInteger(result.expiresAt) &&
    result.expiresAt > Date.now()
  );
}
