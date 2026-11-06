import "server-only";

import { headers } from "next/headers";
import { db } from "./db/client";
import { serverEnv } from "./env";
import { consumeRequestBudget, type RequestBudget } from "./request-budget";
import { checkRequestBudget } from "./request-budget-gate";

export function requestRateLimit(
  requestHeaders: Pick<Headers, "get">,
  scope: RequestBudget["scope"],
) {
  const platform = process.env.VERCEL === "1" ? "vercel" : "local";
  return checkRequestBudget(
    {
      headers: requestHeaders,
      platform,
      // Purpose separation lives in rateLimitIdentity. Never derive identity from cookies.
      // Non-Vercel hosts share one bucket, ignoring all client-supplied proxy headers.
      key: platform === "vercel" ? serverEnv.STAFF_SESSION_SECRET : "local-shared-request-budget",
    },
    scope,
    (budget) => consumeRequestBudget(db, budget),
  );
}

/** Actions enforce this themselves, even when invoked through another route. */
export async function actionRateLimit(scope: RequestBudget["scope"]) {
  return requestRateLimit(await headers(), scope);
}
