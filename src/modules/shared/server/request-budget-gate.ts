import "server-only";

import type { BudgetResult, RequestBudget } from "./request-budget";
import { rateLimitIdentity } from "./rate-limit-identity";

// Proposed launch budgets; synthetic shared-network review remains required.
export const requestBudgetPolicies = {
  lookup: { limit: 1200, windowSeconds: 60 },
  pin: { limit: 30, windowSeconds: 600 },
} as const;

export type RequestBudgetDecision =
  | { status: "allowed" }
  | { status: "limited" | "unavailable"; retryAfterSeconds: number; message: string };

export async function checkRequestBudget(
  context: { headers: Pick<Headers, "get">; platform: "vercel" | "local"; key: string },
  scope: RequestBudget["scope"],
  consume: (budget: RequestBudget) => Promise<BudgetResult>,
): Promise<RequestBudgetDecision> {
  const unavailable = {
    status: "unavailable" as const,
    retryAfterSeconds: 60,
    message: "We couldn’t open this just now. Please try again in a minute.",
  };
  const identity = rateLimitIdentity(context.headers, context.platform, context.key);
  if (!identity) return unavailable;
  try {
    const result = await consume({ identity, scope, ...requestBudgetPolicies[scope] });
    if (result.allowed) return { status: "allowed" };
    const seconds = Math.max(1, Math.ceil(result.retryAfterSeconds));
    return {
      status: "limited",
      retryAfterSeconds: seconds,
      message: `Please wait ${seconds} seconds before trying again. Thank you for your patience.`,
    };
  } catch {
    // Database exceptions can contain SQL parameters. Do not log or return them.
    return unavailable;
  }
}

export function requestBudgetResponse(
  decision: Exclude<RequestBudgetDecision, { status: "allowed" }>,
) {
  return new Response(decision.message, {
    status: decision.status === "limited" ? 429 : 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "Retry-After": String(decision.retryAfterSeconds),
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
