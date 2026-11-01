import "server-only";

import { createPrivateKey, createPublicKey, sign, type KeyObject } from "node:crypto";
import { z } from "zod";

import {
  GATE_PASS_VERSION,
  encodeGatePassPayload,
  gateKeyIdSchema,
  type GatePublicKey,
} from "../lib/gate-token";

/** Key handling and rotation: ADR 0021. Generate a pair with `pnpm gate:keygen`. */

export type GateSigningKeys = {
  kid: string;
  privateKey: KeyObject;
  publicKeys: GatePublicKey[];
};

export type GateKeyError = "missing" | "invalid";

const base64Url = z.string().regex(/^[A-Za-z0-9_-]+$/);

const envSchema = z.object({
  GATE_SIGNING_KEY_ID: gateKeyIdSchema,
  GATE_SIGNING_PRIVATE_KEY: base64Url,
  GATE_RETIRED_PUBLIC_KEYS: z.string().default(""),
});

function spkiOf(key: KeyObject): string {
  return key.export({ format: "der", type: "spki" }).toString("base64url");
}

function ed25519PublicKey(spki: string): KeyObject | null {
  try {
    const key = createPublicKey({
      key: Buffer.from(spki, "base64url"),
      format: "der",
      type: "spki",
    });
    return key.asymmetricKeyType === "ed25519" ? key : null;
  } catch {
    return null;
  }
}

export function loadGateSigningKeys(
  env: Record<string, string | undefined> = process.env,
): { ok: true; value: GateSigningKeys } | { ok: false; error: GateKeyError } {
  if (!env.GATE_SIGNING_KEY_ID && !env.GATE_SIGNING_PRIVATE_KEY) {
    return { ok: false, error: "missing" };
  }
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const {
    GATE_SIGNING_KEY_ID: kid,
    GATE_SIGNING_PRIVATE_KEY,
    GATE_RETIRED_PUBLIC_KEYS,
  } = parsed.data;

  let privateKey: KeyObject;
  try {
    privateKey = createPrivateKey({
      key: Buffer.from(GATE_SIGNING_PRIVATE_KEY, "base64url"),
      format: "der",
      type: "pkcs8",
    });
  } catch {
    return { ok: false, error: "invalid" };
  }
  if (privateKey.asymmetricKeyType !== "ed25519") return { ok: false, error: "invalid" };

  const publicKeys: GatePublicKey[] = [
    { kid, alg: "Ed25519", spki: spkiOf(createPublicKey(privateKey)) },
  ];
  for (const entry of GATE_RETIRED_PUBLIC_KEYS.split(",").map((part) => part.trim())) {
    if (!entry) continue;
    const [retiredKid, spki, ...rest] = entry.split("=");
    if (rest.length > 0 || !retiredKid || !spki) return { ok: false, error: "invalid" };
    if (!gateKeyIdSchema.safeParse(retiredKid).success) return { ok: false, error: "invalid" };
    if (publicKeys.some((key) => key.kid === retiredKid)) return { ok: false, error: "invalid" };
    const key = ed25519PublicKey(spki);
    if (!key) return { ok: false, error: "invalid" };
    publicKeys.push({ kid: retiredKid, alg: "Ed25519", spki: spkiOf(key) });
  }
  return { ok: true, value: { kid, privateKey, publicKeys } };
}

/** Signs a format-1 gate pass. The pass holds identifiers only, never guest details. */
export function signGatePass(
  pass: { invitationId: string; tokenVersion: number },
  keys: GateSigningKeys,
  now: number = Date.now(),
): string {
  const segment = encodeGatePassPayload({
    v: GATE_PASS_VERSION,
    kid: keys.kid,
    inv: pass.invitationId,
    ver: pass.tokenVersion,
    iat: Math.floor(now / 1000),
  });
  const signature = sign(null, Buffer.from(segment, "ascii"), keys.privateKey);
  return `${segment}.${signature.toString("base64url")}`;
}

/** Current signing key first, then retired keys still accepted for verification. */
export function gatePublicKeys(keys: GateSigningKeys): GatePublicKey[] {
  return keys.publicKeys.map(({ kid, alg, spki }) => ({ kid, alg, spki }));
}
