import { generateKeyPairSync, type KeyObject } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  GATE_PASS_MAX_LENGTH,
  decodeBase64Url,
  encodeBase64Url,
  parseGatePass,
  verifyGatePass,
  type GatePublicKey,
} from "../lib/gate-token";
import { gatePublicKeys, loadGateSigningKeys, signGatePass } from "../server/signing";

const INVITATION = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
const NOW = Date.UTC(2026, 11, 19, 15, 0, 0);

function keyEnv(kid: string, privateKey: KeyObject, retired = "") {
  return {
    GATE_SIGNING_KEY_ID: kid,
    GATE_SIGNING_PRIVATE_KEY: privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64url"),
    GATE_RETIRED_PUBLIC_KEYS: retired,
  };
}

function freshKeys(kid = "k2026a") {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const loaded = loadGateSigningKeys(keyEnv(kid, privateKey));
  if (!loaded.ok) throw new Error(`fixture keys failed: ${loaded.error}`);
  return { keys: loaded.value, publicKey, privateKey };
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Deterministic PRNG so a failing fuzz case is reproducible.
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

describe("gate pass signing and verification", () => {
  it("round-trips the ADR 0020 payload", async () => {
    const { keys } = freshKeys();
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 3 }, keys, NOW);
    const result = await verifyGatePass(token, gatePublicKeys(keys), { now: NOW });
    expect(result).toEqual({
      ok: true,
      payload: { v: 1, kid: "k2026a", inv: INVITATION, ver: 3, iat: NOW / 1000 },
    });
    expect(token.length).toBeLessThan(GATE_PASS_MAX_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("carries no names, contact details or party size", () => {
    const { keys } = freshKeys();
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, keys, NOW);
    const parsed = parseGatePass(token);
    expect(parsed.ok && Object.keys(parsed.value.payload).sort()).toEqual([
      "iat",
      "inv",
      "kid",
      "v",
      "ver",
    ]);
  });

  it("rejects 1,000 tampered tokens, changing characters and decoded bytes", async () => {
    const { keys } = freshKeys();
    const ring = gatePublicKeys(keys);
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 2 }, keys, NOW);
    const [payloadPart, signaturePart] = token.split(".") as [string, string];
    const random = prng(56);
    const tampered = new Set<string>();

    while (tampered.size < 1_000) {
      const mode = tampered.size % 2;
      let candidate: string;
      if (mode === 0) {
        // Replace one character of the token string with a different alphabet character.
        const index = Math.floor(random() * token.length);
        if (token[index] === ".") continue;
        const replacement = ALPHABET[Math.floor(random() * ALPHABET.length)];
        if (replacement === undefined || replacement === token[index]) continue;
        candidate = token.slice(0, index) + replacement + token.slice(index + 1);
      } else {
        // Flip one bit of one decoded byte in either segment, then re-encode canonically.
        const target = random() < 0.5 ? "payload" : "signature";
        const bytes = decodeBase64Url(target === "payload" ? payloadPart : signaturePart);
        if (!bytes) throw new Error("fixture segment must decode");
        const index = Math.floor(random() * bytes.length);
        bytes[index] = (bytes[index] ?? 0) ^ (1 << Math.floor(random() * 8));
        const segment = encodeBase64Url(bytes);
        candidate =
          target === "payload" ? `${segment}.${signaturePart}` : `${payloadPart}.${segment}`;
      }
      if (candidate === token) continue;
      tampered.add(candidate);
    }

    for (const candidate of tampered) {
      const result = await verifyGatePass(candidate, ring, { now: NOW });
      expect(result.ok, candidate).toBe(false);
    }
  });

  it.each([
    ["empty", ""],
    ["no separator", "abc"],
    ["three segments", "a.b.c"],
    ["padding", "YQ==.YQ"],
    ["invalid characters", "a+b.c/d"],
    ["oversized", `${"a".repeat(GATE_PASS_MAX_LENGTH)}.a`],
  ])("rejects a malformed token (%s)", async (_label, token) => {
    const { keys } = freshKeys();
    expect(await verifyGatePass(token, gatePublicKeys(keys), { now: NOW })).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects non-canonical base64url that decodes to the same bytes", () => {
    // "YR" and "YQ" both decode to "a"; only "YQ" is canonical.
    expect(decodeBase64Url("YQ")).toEqual(new Uint8Array([97]));
    expect(decodeBase64Url("YR")).toBeNull();
  });

  it("rejects payloads that fail the schema even with a valid signature shape", async () => {
    const { keys } = freshKeys();
    const ring = gatePublicKeys(keys);
    const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ v: 2, kid: "k2026a" })));
    const signature = encodeBase64Url(new Uint8Array(64));
    expect(await verifyGatePass(`${body}.${signature}`, ring, { now: NOW })).toEqual({
      ok: false,
      reason: "malformed",
    });
  });

  it("rejects a pass signed by a key the scanner does not hold", async () => {
    const signer = freshKeys("k-other");
    const scanner = freshKeys("k2026a");
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, signer.keys, NOW);
    expect(await verifyGatePass(token, gatePublicKeys(scanner.keys), { now: NOW })).toEqual({
      ok: false,
      reason: "unknown-key",
    });
  });

  it("rejects a forged signature under a known key id", async () => {
    const real = freshKeys("k2026a");
    const forger = freshKeys("k2026a");
    const forged = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, forger.keys, NOW);
    expect(await verifyGatePass(forged, gatePublicKeys(real.keys), { now: NOW })).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("allows 10 minutes of clock skew and rejects passes issued further in the future", async () => {
    const { keys } = freshKeys();
    const ring = gatePublicKeys(keys);
    const withinSkew = signGatePass(
      { invitationId: INVITATION, tokenVersion: 1 },
      keys,
      NOW + 600_000,
    );
    const tooFar = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, keys, NOW + 601_000);
    expect((await verifyGatePass(withinSkew, ring, { now: NOW })).ok).toBe(true);
    expect(await verifyGatePass(tooFar, ring, { now: NOW })).toEqual({
      ok: false,
      reason: "issued-in-future",
    });
  });
});

describe("gate signing keys and rotation", () => {
  it("keeps verifying passes from a retired key until it is removed", async () => {
    const old = generateKeyPairSync("ed25519");
    const current = generateKeyPairSync("ed25519");
    const oldKeys = loadGateSigningKeys(keyEnv("k-old", old.privateKey));
    if (!oldKeys.ok) throw new Error("fixture");
    const oldPass = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, oldKeys.value, NOW);

    const retiredEntry = `k-old=${old.publicKey.export({ format: "der", type: "spki" }).toString("base64url")}`;
    const rotated = loadGateSigningKeys(keyEnv("k-new", current.privateKey, retiredEntry));
    const removed = loadGateSigningKeys(keyEnv("k-new", current.privateKey));
    if (!rotated.ok || !removed.ok) throw new Error("fixture");

    expect(gatePublicKeys(rotated.value).map((key) => key.kid)).toEqual(["k-new", "k-old"]);
    expect((await verifyGatePass(oldPass, gatePublicKeys(rotated.value), { now: NOW })).ok).toBe(
      true,
    );
    expect(await verifyGatePass(oldPass, gatePublicKeys(removed.value), { now: NOW })).toEqual({
      ok: false,
      reason: "unknown-key",
    });
    const newPass = signGatePass({ invitationId: INVITATION, tokenVersion: 1 }, rotated.value, NOW);
    expect(parseGatePass(newPass).ok && parseGatePass(newPass)).toMatchObject({
      value: { payload: { kid: "k-new" } },
    });
  });

  it("reports missing signing keys as an expected error", () => {
    expect(loadGateSigningKeys({})).toEqual({ ok: false, error: "missing" });
  });

  it.each([
    ["bad key id", { GATE_SIGNING_KEY_ID: "Bad Id!", GATE_SIGNING_PRIVATE_KEY: "AAAA" }],
    ["not a key", { GATE_SIGNING_KEY_ID: "k1", GATE_SIGNING_PRIVATE_KEY: "AAAA" }],
  ])("reports invalid signing keys (%s)", (_label, env) => {
    expect(loadGateSigningKeys(env)).toEqual({ ok: false, error: "invalid" });
  });

  it("rejects a non-Ed25519 private key", () => {
    const { privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
    expect(loadGateSigningKeys(keyEnv("k1", privateKey))).toEqual({ ok: false, error: "invalid" });
  });

  it("rejects malformed or duplicate retired keys", () => {
    const current = generateKeyPairSync("ed25519");
    const spki = current.publicKey.export({ format: "der", type: "spki" }).toString("base64url");
    expect(loadGateSigningKeys(keyEnv("k1", current.privateKey, "no-equals"))).toEqual({
      ok: false,
      error: "invalid",
    });
    expect(loadGateSigningKeys(keyEnv("k1", current.privateKey, `k1=${spki}`))).toEqual({
      ok: false,
      error: "invalid",
    });
  });

  it("publishes public keys only", () => {
    const { keys } = freshKeys();
    const published: GatePublicKey[] = gatePublicKeys(keys);
    expect(published).toHaveLength(1);
    expect(Object.keys(published[0] ?? {}).sort()).toEqual(["alg", "kid", "spki"]);
    expect(JSON.stringify(published)).not.toContain(
      keyEnv("x", freshKeys().privateKey).GATE_SIGNING_PRIVATE_KEY,
    );
  });
});
