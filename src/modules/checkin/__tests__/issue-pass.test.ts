import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { issueGatePass } from "../server/issue-pass";
import { loadGateSigningKeys, gatePublicKeys } from "../server/signing";
import { verifyGatePass } from "../lib/gate-token";
import type { StoredPass } from "../lib/pass-eligibility";

const id = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
const now = Date.UTC(2026, 11, 19, 12);
const pair = generateKeyPairSync("ed25519");
const keys = loadGateSigningKeys({
  GATE_SIGNING_KEY_ID: "test-044",
  GATE_SIGNING_PRIVATE_KEY: pair.privateKey
    .export({ format: "der", type: "pkcs8" })
    .toString("base64url"),
});
const stored: StoredPass = {
  status: "rsvp_yes",
  tokenVersion: 3,
  attending: true,
  countAttending: 2,
  householdName: "Test household",
  primaryNames: ["Ada"],
  tableNumber: 7,
};
function dependencies(value: StoredPass | null = stored) {
  return { keys, load: vi.fn(async () => value), siteUrl: "https://wedding.example", now };
}
describe("authorized pass issuance", () => {
  it("rejects malformed identities before storage", async () => {
    const deps = dependencies();
    expect(await issueGatePass("editing-token", deps)).toEqual({ state: "absent" });
    expect(deps.load).not.toHaveBeenCalled();
  });
  it.each(["draft", "sent", "rsvp_no", "revoked"] as const)(
    "never issues for %s",
    async (status) => {
      expect(await issueGatePass(id, dependencies({ ...stored, status }))).toEqual({
        state: "absent",
      });
    },
  );
  it.each([null, { ...stored, attending: false }, { ...stored, countAttending: 0 }])(
    "requires attendance and seats",
    async (value) => {
      expect(await issueGatePass(id, dependencies(value))).toEqual({ state: "absent" });
    },
  );
  it("returns unavailable when signing is not configured", async () => {
    expect(
      await issueGatePass(id, { ...dependencies(), keys: { ok: false, error: "missing" } }),
    ).toEqual({ state: "unavailable" });
  });
  it("signs current version without guest details", async () => {
    const result = await issueGatePass(id, dependencies());
    expect(result.state).toBe("ready");
    if (result.state !== "ready" || !keys.ok) throw new Error("Expected an issued pass");
    const url = new URL(result.url);
    expect(url.origin).toBe("https://wedding.example");
    expect(url.pathname.startsWith("/p/")).toBe(true);
    const verified = await verifyGatePass(url.pathname.slice(3), gatePublicKeys(keys.value), {
      now,
    });
    expect(verified.ok).toBe(true);
    if (!verified.ok) throw new Error("Expected valid signature");
    expect(verified.payload.inv).toBe(id);
    expect(verified.payload.ver).toBe(3);
    expect(result.pass).toEqual({
      names: ["Ada"],
      householdName: "Test household",
      partySize: 2,
      tableNumber: 7,
    });
    expect(JSON.stringify(verified.payload)).not.toContain("Ada");
    expect(JSON.stringify(verified.payload)).not.toContain("Test household");
  });
});
