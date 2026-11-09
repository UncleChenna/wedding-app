import { generateKeyPairSync, sign } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeGatePassPayload, verifyGatePass, type GatePublicKey } from "../lib/gate-token";

const now = Date.UTC(2026, 11, 19, 16);
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const ring: GatePublicKey[] = [
  {
    kid: "scanner",
    alg: "Ed25519",
    spki: publicKey.export({ type: "spki", format: "der" }).toString("base64url"),
  },
];
const payload = {
  v: 1 as const,
  kid: "scanner",
  inv: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
  ver: 1,
  iat: now / 1000,
};
function token(iat = payload.iat) {
  const encoded = encodeGatePassPayload({ ...payload, iat });
  return `${encoded}.${sign(null, Buffer.from(encoded), privateKey).toString("base64url")}`;
}
afterEach(() => vi.unstubAllGlobals());
describe("scanner fallback", () => {
  it("rejects noncanonical high-S even if native crypto accepts it", async () => {
    const nativeVerify = vi.fn().mockResolvedValue(true);
    vi.stubGlobal("crypto", {
      subtle: { importKey: vi.fn().mockResolvedValue({}), verify: nativeVerify },
    });
    const { keys, vectors } = gateVerificationVectors();
    const vector = vectors.find((candidate) => candidate.label === "noncanonical high-S");
    if (!vector) throw new Error("Missing high-S vector");
    await expect(verifyGatePass(vector.token, keys, { now })).resolves.toEqual({
      ok: false,
      reason: "bad-signature",
    });
    expect(nativeVerify).not.toHaveBeenCalled();
  });
  it("verifies without WebCrypto and preserves future-issued rejection", async () => {
    vi.stubGlobal("crypto", undefined);
    await expect(verifyGatePass(token(), ring, { now })).resolves.toEqual({ ok: true, payload });
    await expect(verifyGatePass(token(payload.iat + 601), ring, { now })).resolves.toEqual({
      ok: false,
      reason: "issued-in-future",
    });
  });
  it("falls back when Ed25519 import is unsupported", async () => {
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: vi.fn().mockRejectedValue(new DOMException("Unavailable", "NotSupportedError")),
      },
    });
    await expect(verifyGatePass(token(), ring, { now })).resolves.toEqual({ ok: true, payload });
  });
  it("rejects a forged signature when WebCrypto is unavailable", async () => {
    vi.stubGlobal("crypto", undefined);
    const forged = `${encodeGatePassPayload(payload)}.${Buffer.alloc(64).toString("base64url")}`;
    await expect(verifyGatePass(forged, ring, { now })).resolves.toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });
  it("rejects malformed SPKI and non-finite clocks", async () => {
    vi.stubGlobal("crypto", undefined);
    const key = ring[0];
    if (!key) throw new Error("Missing fixture key");
    await expect(
      verifyGatePass(token(), [{ ...key, spki: Buffer.alloc(44).toString("base64url") }], {
        now,
      }),
    ).resolves.toEqual({ ok: false, reason: "unknown-key" });
    await expect(verifyGatePass(token(), ring, { now: NaN })).resolves.toEqual({
      ok: false,
      reason: "malformed",
    });
  });
  it("does not retry a native false result through fallback", async () => {
    vi.stubGlobal("crypto", {
      subtle: {
        importKey: vi.fn().mockResolvedValue({}),
        verify: vi.fn().mockResolvedValue(false),
      },
    });
    await expect(verifyGatePass(token(), ring, { now })).resolves.toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });
});

import { verifyScannerToken } from "../lib/verify";
import { gateVerificationVectors } from "../../../../e2e/fixtures/gate-verification-vectors";
describe.each([false, true])("shared scanner vectors, fallback=%s", (fallback) => {
  it("preserves credential and session policy", async () => {
    if (fallback) vi.stubGlobal("crypto", undefined);
    const { keys, vectors } = gateVerificationVectors();
    for (const vector of vectors) {
      expect(await verifyScannerToken(vector.token, keys, vector), vector.label).toEqual(
        vector.expected,
      );
    }
  });
});
