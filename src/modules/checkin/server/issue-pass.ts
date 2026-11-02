import "server-only";
import { z } from "zod";
import type { Db } from "@/modules/shared/server/db/client";
import { passEligibility, type PassView, type StoredPass } from "../lib/pass-eligibility";
import { GATE_PASS_VERSION } from "../lib/gate-token";
import { gatePassUrl } from "../lib/pass-url";
import { findStoredPass } from "./pass-repository";
import { loadGateSigningKeys, signGatePass } from "./signing";

export type IssuedGatePass =
  { state: "ready"; url: string; pass: PassView } | { state: "absent" | "unavailable" };

type Dependencies = {
  keys: ReturnType<typeof loadGateSigningKeys>;
  load: (invitationId: string) => Promise<StoredPass | null>;
  siteUrl: string;
  now: number;
};

/** Internal service: caller must resolve the personal invitation credential first.
 * Never expose this as an unauthenticated action accepting a database ID.
 */
export function issueGatePassFrom(
  db: Pick<Db, "select">,
  identity: { id: string; tokenVersion: number },
  siteUrl: string,
) {
  return issueGatePass(identity, {
    keys: loadGateSigningKeys(),
    load: (id) => findStoredPass(db, id),
    siteUrl,
    now: Date.now(),
  });
}

export async function issueGatePass(
  identity: unknown,
  deps: Dependencies,
): Promise<IssuedGatePass> {
  const parsed = z
    .object({ id: z.uuid(), tokenVersion: z.number().int().positive() })
    .safeParse(identity);
  if (!parsed.success) return { state: "absent" };
  const stored = await deps.load(parsed.data.id);
  if (!stored || stored.tokenVersion !== parsed.data.tokenVersion) return { state: "absent" };
  const resolution = passEligibility(
    {
      v: GATE_PASS_VERSION,
      kid: "eligibility",
      inv: parsed.data.id,
      ver: stored.tokenVersion,
      iat: Math.floor(deps.now / 1000),
    },
    stored,
  );
  if (resolution.state !== "valid") return { state: "absent" };
  if (!deps.keys.ok) return { state: "unavailable" };
  const token = signGatePass(
    { invitationId: parsed.data.id, tokenVersion: stored.tokenVersion },
    deps.keys.value,
    deps.now,
  );
  return { state: "ready", url: gatePassUrl(deps.siteUrl, token), pass: resolution.pass };
}
