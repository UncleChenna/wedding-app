import { orderResponseSchema, type OrderResult } from "./order-contract";
import type { OrderSubmission } from "./order";

export const ORDERS_URL = "/api/orders";
/** Waits before attempts 2, 3 and 4. Every attempt reuses the same client request id. */
export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
export const ATTEMPT_TIMEOUT_MS = 10_000;

/** RFC 4122 v4 id; `randomUUID` is missing in some older in-app browsers, `getRandomValues` is not. */
export function newRequestId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export type SubmitOutcome =
  | { status: "sent"; orderId: string }
  | { status: "limited"; retryAfterSeconds: number }
  | { status: "rejected"; result: Extract<OrderResult, { status: "rejected" }> }
  | { status: "failed" };

export interface SubmitDeps {
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
  /** Called before each attempt with its 1-based number, so the page can say it's still trying. */
  onAttempt?: (attempt: number) => void;
}

/**
 * Sends an order and retries transport failures and 5xx responses with backoff. Rejections are
 * final: retrying would only repeat them. A lost response after the server committed is safe,
 * because the retry carries the same id and the server answers with the original order.
 */
export async function submitOrder(
  order: OrderSubmission,
  deps: SubmitDeps,
): Promise<SubmitOutcome> {
  const body = JSON.stringify(order);
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    if (attempt > 1) await deps.sleep(RETRY_DELAYS_MS[attempt - 2] ?? 0);
    deps.onAttempt?.(attempt);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const response = await deps.fetch(ORDERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        cache: "no-store",
        signal: controller.signal,
      });
      if (response.status === 429)
        return {
          status: "limited",
          retryAfterSeconds: retryAfterSeconds(response.headers.get("Retry-After")),
        };
      if (response.status >= 500 || response.status === 408) continue;
      const parsed = orderResponseSchema.safeParse(await response.json());
      if (!parsed.success) continue;
      const result = parsed.data;
      if (result.status === "created" || result.status === "replayed")
        return { status: "sent", orderId: result.orderId };
      if (result.status === "rejected") return { status: "rejected", result };
    } catch {
      // Offline, timed out or a cut connection: try again with the same id.
    } finally {
      clearTimeout(timer);
    }
  }
  return { status: "failed" };
}

/** Our API emits seconds; accept standard HTTP dates as well. Never retry malformed waits early. */
export function retryAfterSeconds(value: string | null, now = Date.now()): number {
  if (!value) return 60;
  const seconds = /^\d+$/.test(value) ? Number(value) : (Date.parse(value) - now) / 1000;
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(86400, Math.ceil(seconds)) : 60;
}
