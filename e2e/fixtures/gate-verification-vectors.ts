import { generateKeyPairSync, sign } from "node:crypto";
import {
  encodeGatePassPayload,
  type GatePassPayload,
  type GatePublicKey,
} from "../../src/modules/checkin/lib/gate-token";

/** Synthetic keys generated per run; private bytes never enter browser fixture data. */
export function gateVerificationVectors() {
  const now = Date.UTC(2026, 11, 19, 16);
  const deadline = Date.UTC(2026, 11, 20, 6);
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const payload: GatePassPayload = {
    v: 1,
    kid: "scanner-2026",
    inv: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
    ver: 2147483647,
    iat: now / 1000,
  };
  function signed(value: GatePassPayload) {
    const encoded = encodeGatePassPayload(value);
    return `${encoded}.${sign(null, Buffer.from(encoded), privateKey).toString("base64url")}`;
  }
  const token = signed(payload);
  const signature = token.split(".")[1];
  if (!signature) throw new Error("Missing fixture signature");
  // Ed25519 scalar S must be less than the subgroup order. Adding the order
  // preserves the group equation but must never produce an accepted signature.
  const highS = Buffer.from(signature, "base64url");
  let scalar = 0n;
  for (let i = 63; i >= 32; i--) scalar = (scalar << 8n) | BigInt(highS[i] ?? 0);
  scalar += (1n << 252n) + 27742317777372353535851937790883648493n;
  for (let i = 32; i < 64; i++) {
    highS[i] = Number(scalar & 255n);
    scalar >>= 8n;
  }
  const keys: GatePublicKey[] = [
    {
      kid: payload.kid,
      alg: "Ed25519",
      spki: publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
    },
  ];
  return {
    keys,
    vectors: [
      {
        label: "noncanonical high-S",
        token: `${encodeGatePassPayload(payload)}.${highS.toString("base64url")}`,
        now,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "bad-signature" },
      },
      { label: "valid", token, now, sessionExpiresAt: deadline, expected: { ok: true, payload } },
      {
        label: "tampered",
        token: `${encodeGatePassPayload({ ...payload, ver: 1 })}.${signature}`,
        now,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "bad-signature" },
      },
      {
        label: "forged",
        token: `${encodeGatePassPayload(payload)}.${Buffer.alloc(64).toString("base64url")}`,
        now,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "bad-signature" },
      },
      {
        label: "future boundary",
        token: signed({ ...payload, iat: payload.iat + 600 }),
        now,
        sessionExpiresAt: deadline,
        expected: { ok: true, payload: { ...payload, iat: payload.iat + 600 } },
      },
      {
        label: "future rejected",
        token: signed({ ...payload, iat: payload.iat + 601 }),
        now,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "issued-in-future" },
      },
      {
        label: "expired session",
        token,
        now: deadline,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "session-expired" },
      },
      {
        label: "old token no invented expiry",
        token: signed({ ...payload, iat: payload.iat - 365 * 86400 }),
        now,
        sessionExpiresAt: deadline,
        expected: { ok: true, payload: { ...payload, iat: payload.iat - 365 * 86400 } },
      },
      {
        label: "unknown key",
        token: signed({ ...payload, kid: "removed-key" }),
        now,
        sessionExpiresAt: deadline,
        expected: { ok: false, reason: "unknown-key" },
      },
    ],
    // Kept in Node only, for exact-byte leak checks on the verifier bundle/cache.
    privateMaterial: privateKey.export({ format: "der", type: "pkcs8" }).toString("base64url"),
  };
}
