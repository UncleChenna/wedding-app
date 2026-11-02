import { z } from "zod";

/**
 * Gate pass format 1 (ADR 0020): `base64url(JSON payload).base64url(Ed25519 signature)`.
 * The signature covers the ASCII payload segment. This file is shared with scanner devices
 * (TICKET-057), so it uses WebCrypto and never imports Node or server code.
 */

export const GATE_PASS_VERSION = 1;
export const GATE_PASS_MAX_LENGTH = 512;
/** ADR 0020 row 11: reject passes issued more than 10 minutes ahead of the device clock. */
export const GATE_PASS_MAX_FUTURE_SKEW_SECONDS = 600;

export const gateKeyIdSchema = z.string().regex(/^[a-z0-9-]{1,32}$/);

export const gatePassPayloadSchema = z.strictObject({
  v: z.literal(GATE_PASS_VERSION),
  kid: gateKeyIdSchema,
  inv: z.uuid(),
  ver: z.number().int().positive().max(2_147_483_647),
  iat: z.number().int().nonnegative(),
});

export type GatePassPayload = z.infer<typeof gatePassPayloadSchema>;

/** A published verification key: raw SPKI DER, base64url-encoded. */
export type GatePublicKey = { kid: string; alg: "Ed25519"; spki: string };

export type GatePassFailure = "malformed" | "unknown-key" | "bad-signature" | "issued-in-future";

export type GatePassVerification =
  { ok: true; payload: GatePassPayload } | { ok: false; reason: GatePassFailure };

const SEGMENT = /^[A-Za-z0-9_-]+$/;

export function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes canonical, unpadded base64url only; any other spelling of the same bytes is rejected. */
export function decodeBase64Url(segment: string): Uint8Array<ArrayBuffer> | null {
  if (!SEGMENT.test(segment) || segment.length % 4 === 1) return null;
  let binary: string;
  try {
    binary = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return encodeBase64Url(bytes) === segment ? bytes : null;
}

export function encodeGatePassPayload(payload: GatePassPayload): string {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

export type ParsedGatePass = {
  payload: GatePassPayload;
  signedSegment: string;
  signature: Uint8Array<ArrayBuffer>;
};

export function parseGatePass(
  token: string,
): { ok: true; value: ParsedGatePass } | { ok: false; reason: "malformed" } {
  const malformed = { ok: false, reason: "malformed" } as const;
  if (token.length === 0 || token.length > GATE_PASS_MAX_LENGTH) return malformed;
  const parts = token.split(".");
  if (parts.length !== 2) return malformed;
  const [signedSegment, signatureSegment] = parts as [string, string];
  const payloadBytes = decodeBase64Url(signedSegment);
  const signature = decodeBase64Url(signatureSegment);
  if (!payloadBytes || !signature || signature.length !== 64) return malformed;
  let json: unknown;
  try {
    json = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(payloadBytes));
  } catch {
    return malformed;
  }
  const payload = gatePassPayloadSchema.safeParse(json);
  if (!payload.success) return malformed;
  return { ok: true, value: { payload: payload.data, signedSegment, signature } };
}

export async function verifyGatePass(
  token: string,
  keys: readonly GatePublicKey[],
  options: { now: number; maxFutureSkewSeconds?: number },
): Promise<GatePassVerification> {
  const parsed = parseGatePass(token);
  if (!parsed.ok) return parsed;
  const { payload, signedSegment, signature } = parsed.value;

  const published = keys.find((key) => key.kid === payload.kid);
  const spki = published ? decodeBase64Url(published.spki) : null;
  if (!spki) return { ok: false, reason: "unknown-key" };

  let valid: boolean;
  try {
    const key = await crypto.subtle.importKey("spki", spki, { name: "Ed25519" }, false, ["verify"]);
    valid = await crypto.subtle.verify(
      { name: "Ed25519" },
      key,
      signature,
      new TextEncoder().encode(signedSegment),
    );
  } catch {
    return { ok: false, reason: "unknown-key" };
  }
  if (!valid) return { ok: false, reason: "bad-signature" };

  const skew = options.maxFutureSkewSeconds ?? GATE_PASS_MAX_FUTURE_SKEW_SECONDS;
  if (payload.iat > Math.floor(options.now / 1000) + skew) {
    return { ok: false, reason: "issued-in-future" };
  }
  return { ok: true, payload };
}
