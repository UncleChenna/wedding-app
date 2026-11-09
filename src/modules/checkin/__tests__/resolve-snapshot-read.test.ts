import { generateKeyPairSync, sign } from "node:crypto";
import { expect, it } from "vitest";
import { encodeGatePassPayload } from "../lib/gate-token";
import { resolveSnapshotRead } from "../lib/resolve-snapshot-read";
import type { GuestSnapshot } from "../lib/guest-snapshot";
const pair = generateKeyPairSync("ed25519");
const origin = "https://wedding.example";
const invitationId = "11111111-1111-4111-8111-111111111111";
function qr(version = 1) {
  const body = encodeGatePassPayload({
    v: 1,
    kid: "test",
    inv: invitationId,
    ver: version,
    iat: 0,
  });
  return `${origin}/p/${body}.${sign(null, Buffer.from(body), pair.privateKey).toString("base64url")}`;
}
function snapshot(): GuestSnapshot {
  return {
    version: 1,
    session: "a".repeat(64),
    generatedAt: Date.now() - 3_600_000,
    expiresAt: Date.now() + 60_000,
    keys: [
      {
        kid: "test",
        alg: "Ed25519",
        spki: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
      },
    ],
    invitations: [
      {
        invitationId,
        tokenVersion: 1,
        status: "rsvp_yes",
        attending: true,
        partySize: 3,
        admittedSoFar: 1,
        name: "Synthetic family",
        names: ["Synthetic guest"],
        tableNumber: 4,
      },
    ],
  };
}
it("verifies the real signature and resolves a stale snapshot without recording admission", async () => {
  const value = snapshot();
  const before = structuredClone(value);
  expect(await resolveSnapshotRead(qr(), origin, value, value)).toEqual({
    state: "valid",
    guest: {
      name: "Synthetic family",
      partySize: 3,
      admittedSoFar: 1,
      tableNumber: 4,
      admissions: [],
    },
  });
  expect(value).toEqual(before);
});
it.each(["already_used", "revoked", "replaced", "unknown"] as const)(
  "resolves %s from cached state",
  async (state) => {
    const value = snapshot();
    const row = value.invitations[0];
    if (!row) throw new Error("Fixture row missing");
    if (state === "already_used") row.admittedSoFar = row.partySize;
    if (state === "revoked") row.status = "revoked";
    if (state === "replaced") row.tokenVersion = 2;
    if (state === "unknown") value.invitations = [];
    expect(await resolveSnapshotRead(qr(), origin, value, value)).toMatchObject({ state });
  },
);
it("withholds data after trusted session expiry or replacement", async () => {
  const value = snapshot();
  expect(
    await resolveSnapshotRead(qr(), origin, value, { ...value, expiresAt: Date.now() }),
  ).toEqual({ state: "session_expired" });
  expect(
    await resolveSnapshotRead(qr(), origin, value, { ...value, session: "b".repeat(64) }),
  ).toEqual({ state: "session_expired" });
});
it("never accepts altered signatures, foreign URLs or private extra fields", async () => {
  const value = snapshot();
  expect(
    await resolveSnapshotRead(
      qr().replace("wedding.example", "evil.example"),
      origin,
      value,
      value,
    ),
  ).toEqual({ state: "invalid" });
  expect(await resolveSnapshotRead(qr().slice(0, -4) + "XXXX", origin, value, value)).toEqual({
    state: "invalid",
  });
  expect(await resolveSnapshotRead(qr(), origin, { ...value, email: "private" }, value)).toEqual({
    state: "unavailable",
  });
});
