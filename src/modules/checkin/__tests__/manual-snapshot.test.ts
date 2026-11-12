import { generateKeyPairSync } from "node:crypto";
import { expect, it } from "vitest";
import { resolveManualSnapshot } from "../lib/manual-snapshot";
import type { GuestSnapshot } from "../lib/guest-snapshot";

const invitationId = "11111111-1111-4111-8111-111111111111";
function fixture(): GuestSnapshot {
  return {
    version: 1,
    session: "a".repeat(64),
    generatedAt: Date.now() - 1000,
    expiresAt: Date.now() + 60000,
    keys: [
      {
        kid: "test",
        alg: "Ed25519",
        spki: generateKeyPairSync("ed25519")
          .publicKey.export({ format: "der", type: "spki" })
          .toString("base64url"),
      },
    ],
    invitations: [
      {
        invitationId,
        tokenVersion: 2,
        status: "rsvp_yes",
        attending: true,
        partySize: 3,
        admittedSoFar: 1,
        name: "Synthetic family",
        names: ["Ada Adébayo", "Chidi Okafor"],
        tableNumber: 4,
      },
    ],
  };
}
it("searches cached companion names and projects current read-only household state", () => {
  const value = fixture();
  const before = structuredClone(value);
  expect(resolveManualSnapshot({ operation: "search", query: "okafor" }, value, value)).toEqual({
    state: "matches",
    hasMore: false,
    matches: [{ invitationId, name: "Synthetic family", matchedName: "Chidi Okafor" }],
  });
  expect(resolveManualSnapshot({ operation: "read", invitationId }, value, value)).toMatchObject({
    state: "selection",
    invitationId,
    version: 2,
    result: { state: "valid", guest: { partySize: 3, admittedSoFar: 1, tableNumber: 4 } },
  });
  expect(value).toEqual(before);
});
it("refuses malformed, expired, or different-session private snapshots", () => {
  const value = fixture();
  const input = { operation: "search" as const, query: "Ada" };
  expect(resolveManualSnapshot(input, {}, value)).toEqual({ state: "unavailable" });
  expect(resolveManualSnapshot(input, value, { ...value, expiresAt: Date.now() })).toEqual({
    state: "session_expired",
  });
  expect(resolveManualSnapshot(input, value, { ...value, session: "b".repeat(64) })).toEqual({
    state: "session_expired",
  });
});
it("never turns revoked or unknown cached selections into an admission", () => {
  const value = fixture();
  const row = value.invitations[0];
  if (!row) throw new Error("Missing fixture");
  row.status = "revoked";
  expect(resolveManualSnapshot({ operation: "read", invitationId }, value, value)).toMatchObject({
    result: { state: "revoked" },
  });
  expect(
    resolveManualSnapshot(
      { operation: "read", invitationId: "22222222-2222-4222-8222-222222222222" },
      value,
      value,
    ),
  ).toEqual({ state: "invalid" });
});
