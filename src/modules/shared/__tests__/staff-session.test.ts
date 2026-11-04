import { randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import { signStaffSession, readStaffSession } from "../server/staff-session";

const identity = {
  staffId: "c15b27a3-e899-42f1-9e25-0ac45440519c",
  role: "gate" as const,
  credentialVersion: 1,
};
const now = new Date("2026-12-19T10:00:00Z");
const expiry = new Date("2026-12-20T06:00:00Z");

describe("staff session signature", () => {
  it("returns identity only for the issuing device and signing key", () => {
    const key = randomBytes(32);
    const token = signStaffSession(identity, "device-a", expiry, key, now);
    expect(readStaffSession(token, "device-a", key, now)).toMatchObject(identity);
    expect(readStaffSession(token, "device-b", key, now)).toBeNull();
    expect(readStaffSession(token, "device-a", randomBytes(32), now)).toBeNull();
  });

  it("rejects expiry at its exact boundary and sessions issued in the future", () => {
    const key = randomBytes(32);
    const token = signStaffSession(identity, "device-a", expiry, key, now);
    expect(readStaffSession(token, "device-a", key, expiry)).toBeNull();
    expect(readStaffSession(token, "device-a", key, new Date(now.getTime() - 1000))).toBeNull();
  });

  it("rejects tampering, oversized input and noncanonical signatures", () => {
    const key = randomBytes(32);
    const token = signStaffSession(identity, "device-a", expiry, key, now);
    const [body, signature] = token.split(".");
    const changed = Buffer.from(JSON.stringify({ ...identity, role: "kitchen" })).toString(
      "base64url",
    );
    for (const candidate of [
      "",
      "x".repeat(4097),
      `${changed}.${signature}`,
      `${body}.${signature}=`,
      `${token}.extra`,
    ]) {
      expect(readStaffSession(candidate, "device-a", key, now)).toBeNull();
    }
  });

  it("refuses weak keys, empty device binding and expired issuance", () => {
    expect(() => signStaffSession(identity, "device-a", expiry, Buffer.alloc(8), now)).toThrow();
    expect(() => signStaffSession(identity, "", expiry, randomBytes(32), now)).toThrow();
    expect(() => signStaffSession(identity, "device-a", now, randomBytes(32), now)).toThrow();
  });
});
