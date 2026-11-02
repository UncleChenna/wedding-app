import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

import { qrMatrix } from "@/modules/shared/lib/qr";
import { GATE_PASS_MAX_LENGTH } from "../lib/gate-token";
import { gatePassPath, gatePassUrl } from "../lib/pass-url";
import { passEligibility, type StoredPass } from "../lib/pass-eligibility";
import { resolveGatePass } from "../server/resolve-pass";
import { loadGateSigningKeys, signGatePass } from "../server/signing";

const INVITATION = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
const NOW = Date.UTC(2026, 11, 19, 15, 0, 0);

function signingKeys(kid = "k2026a") {
  const { privateKey } = generateKeyPairSync("ed25519");
  const loaded = loadGateSigningKeys({
    GATE_SIGNING_KEY_ID: kid,
    GATE_SIGNING_PRIVATE_KEY: privateKey
      .export({ format: "der", type: "pkcs8" })
      .toString("base64url"),
  });
  if (!loaded.ok) throw new Error("fixture keys");
  return loaded.value;
}

const attending: StoredPass = {
  status: "rsvp_yes",
  tokenVersion: 2,
  attending: true,
  countAttending: 3,
  householdName: "The Okafor family",
  primaryNames: ["Ngozi Okafor"],
  tableNumber: 12,
};

const payload = { v: 1 as const, kid: "k2026a", inv: INVITATION, ver: 2, iat: NOW / 1000 };

describe("pass eligibility (online authority)", () => {
  it("shows a valid pass with names, party size and table only", () => {
    expect(passEligibility(payload, attending)).toEqual({
      state: "valid",
      pass: {
        names: ["Ngozi Okafor"],
        householdName: "The Okafor family",
        partySize: 3,
        tableNumber: 12,
      },
    });
  });

  it.each<[string, StoredPass | null, string]>([
    ["a missing invitation", null, "invalid"],
    ["a revoked invitation", { ...attending, status: "revoked" }, "revoked"],
    ["a reissued invitation (older pass)", { ...attending, tokenVersion: 3 }, "replaced"],
    ["a version the server never issued", { ...attending, tokenVersion: 1 }, "invalid"],
    ["a draft invitation", { ...attending, status: "draft" }, "invalid"],
    [
      "an RSVP of no",
      { ...attending, status: "rsvp_no", attending: false, countAttending: 0 },
      "not-attending",
    ],
    [
      "no RSVP yet",
      { ...attending, status: "sent", attending: null, countAttending: 0 },
      "not-attending",
    ],
    ["an inconsistent zero count", { ...attending, countAttending: 0 }, "not-attending"],
  ])("rejects %s", (_label, stored, state) => {
    expect(passEligibility(payload, stored)).toEqual({ state });
  });

  it("reports revocation ahead of a version change", () => {
    expect(passEligibility(payload, { ...attending, status: "revoked", tokenVersion: 5 })).toEqual({
      state: "revoked",
    });
  });
});

describe("resolveGatePass", () => {
  it("verifies the signature before touching the database", async () => {
    const keys = signingKeys();
    const load = vi.fn().mockResolvedValue(attending);
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 2 }, keys, NOW);
    expect(
      await resolveGatePass(token, { keys: { ok: true, value: keys }, load, now: NOW }),
    ).toMatchObject({
      state: "valid",
    });
    expect(load).toHaveBeenCalledWith(INVITATION);
  });

  it.each([
    ["not a string", 42],
    ["malformed", "not-a-pass"],
    ["oversized", "a".repeat(GATE_PASS_MAX_LENGTH + 1)],
  ])("treats a %s pass as invalid without a lookup", async (_label, token) => {
    const load = vi.fn();
    expect(
      await resolveGatePass(token, { keys: { ok: true, value: signingKeys() }, load, now: NOW }),
    ).toEqual({ state: "invalid" });
    expect(load).not.toHaveBeenCalled();
  });

  it("treats a forged pass as invalid without a lookup", async () => {
    const forged = signGatePass({ invitationId: INVITATION, tokenVersion: 2 }, signingKeys(), NOW);
    const load = vi.fn();
    expect(
      await resolveGatePass(forged, { keys: { ok: true, value: signingKeys() }, load, now: NOW }),
    ).toEqual({ state: "invalid" });
    expect(load).not.toHaveBeenCalled();
  });

  it("treats a pass issued beyond the clock-skew allowance as invalid", async () => {
    const keys = signingKeys();
    const future = signGatePass(
      { invitationId: INVITATION, tokenVersion: 2 },
      keys,
      NOW + 3_600_000,
    );
    expect(
      await resolveGatePass(future, { keys: { ok: true, value: keys }, load: vi.fn(), now: NOW }),
    ).toEqual({ state: "invalid" });
  });

  it("is unavailable, not invalid, when signing keys are not configured", async () => {
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 2 }, signingKeys(), NOW);
    expect(
      await resolveGatePass(token, {
        keys: { ok: false, error: "missing" },
        load: vi.fn(),
        now: NOW,
      }),
    ).toEqual({ state: "unavailable" });
  });

  it("never exposes invitation tokens, contact details or identifiers in a valid result", async () => {
    const keys = signingKeys();
    const token = signGatePass({ invitationId: INVITATION, tokenVersion: 2 }, keys, NOW);
    const result = await resolveGatePass(token, {
      keys: { ok: true, value: keys },
      load: async () => attending,
      now: NOW,
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(INVITATION);
    expect(serialized).not.toContain(token);
    expect(Object.keys(result.state === "valid" ? result.pass : {}).sort()).toEqual([
      "householdName",
      "names",
      "partySize",
      "tableNumber",
    ]);
  });
});

describe("gate pass URLs", () => {
  it("builds the read-only /p/ path, never the /i/ RSVP path", () => {
    expect(gatePassPath("abc.def")).toBe("/p/abc.def");
    expect(gatePassUrl("https://example.com/", "abc.def")).toBe("https://example.com/p/abc.def");
  });

  it("encodes a realistic signed pass URL in a scannable QR", () => {
    const token = signGatePass(
      { invitationId: INVITATION, tokenVersion: 2_147_483_647 },
      signingKeys("k-2026-12-19-main"),
      NOW,
    );
    const url = gatePassUrl("https://uchenna-and-adaora.example.com", token);
    expect(url.length).toBeGreaterThan(250);
    // A worst-case pass is QR version 12 (65 modules) at level M. Shared qr.test.ts decodes
    // this exact length in every theme; this guards against the payload silently growing.
    expect(qrMatrix(url).size).toBeLessThanOrEqual(65);
  });
});
