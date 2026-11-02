import "server-only";

import { logger } from "@/modules/shared/lib/logger";

import { gatePublicKeys, loadGateSigningKeys } from "./signing";

/**
 * Response for GET /api/gate-keys: the public keys scanners use to verify passes offline.
 * Public keys are safe to publish; a short cache lets rotation reach devices within minutes.
 */
export function gatePublicKeysResponse(
  env: Record<string, string | undefined> = process.env,
): Response {
  const keys = loadGateSigningKeys(env);
  if (!keys.ok) {
    logger.warn("gate signing keys unavailable", { reason: keys.error });
    return Response.json(
      { error: "Gate keys are not available yet." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    { keys: gatePublicKeys(keys.value) },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
