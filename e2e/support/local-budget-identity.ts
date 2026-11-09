import { createHmac } from "node:crypto";

/** Matches the server's daily local bucket; never reads a deployment secret. */
export function localBudgetIdentity(now = Date.now()): string {
  const salt = createHmac("sha256", "local-shared-request-budget")
    .update(`rate-limit:salt:v2:${Math.floor(now / 86_400_000)}`)
    .digest();
  return createHmac("sha256", salt).update("rate-limit:identity:v2:local-shared").digest("hex");
}
