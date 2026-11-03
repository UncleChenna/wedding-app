import "server-only";

import { logger } from "@/modules/shared/lib/logger";
import type { Db } from "@/modules/shared/server/db/client";

import { parseGatePass, verifyGatePass } from "../lib/gate-token";
import { passEligibility, type PassResolution, type StoredPass } from "../lib/pass-eligibility";
import { findStoredPass } from "./pass-repository";
import { gatePublicKeys, loadGateSigningKeys } from "./signing";

type Dependencies = {
  keys: ReturnType<typeof loadGateSigningKeys>;
  load: (invitationId: string) => Promise<StoredPass | null>;
  now: number;
};

/** Production wiring for the `/p/<pass>` route. */
export function resolveGatePassFrom(db: Pick<Db, "select">, token: unknown) {
  return resolveGatePass(token, {
    keys: loadGateSigningKeys(),
    load: (invitationId) => findStoredPass(db, invitationId),
    now: Date.now(),
  });
}

/**
 * Resolves a `/p/<pass>` URL to a read-only, guest-safe state. The signature is checked before
 * any database read, and only the outcome is logged, never the pass or guest details.
 */
export async function resolveGatePass(token: unknown, deps: Dependencies): Promise<PassResolution> {
  const result = await resolve(token, deps);
  logger.info("gate pass resolved", { state: result.state });
  return result;
}

async function resolve(token: unknown, { keys, load, now }: Dependencies): Promise<PassResolution> {
  if (typeof token !== "string" || !parseGatePass(token).ok) return { state: "invalid" };
  if (!keys.ok) return { state: "unavailable" };
  const verified = await verifyGatePass(token, gatePublicKeys(keys.value), { now });
  if (!verified.ok) return { state: "invalid" };
  return passEligibility(verified.payload, await load(verified.payload.inv));
}
