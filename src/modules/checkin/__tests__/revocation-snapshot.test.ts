import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { gatePublicKeys, loadGateSigningKeys, signGatePass } from "../server/signing";
import { verifyGatePass } from "../lib/gate-token";
import {
  credentialSnapshotSchema,
  snapshotCredentialState,
  snapshotFreshness,
} from "../lib/revocation-snapshot";
const invitationId = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
const now = Date.UTC(2026, 11, 19, 15);
const snapshot = {
  generatedAt: new Date(now).toISOString(),
  invitations: [{ invitationId, tokenVersion: 3, status: "rsvp_yes" as const }],
};

describe("revocation snapshot contract", () => {
  it("keeps an old QR cryptographically valid but rejects it after a reissue refresh", async () => {
    const { privateKey } = generateKeyPairSync("ed25519");
    const keys = loadGateSigningKeys({
      GATE_SIGNING_KEY_ID: "test",
      GATE_SIGNING_PRIVATE_KEY: privateKey
        .export({ format: "der", type: "pkcs8" })
        .toString("base64url"),
    });
    if (!keys.ok) throw new Error("fixture key failed");
    const signed = signGatePass({ invitationId, tokenVersion: 3 }, keys.value, now);
    const verified = await verifyGatePass(signed, gatePublicKeys(keys.value), { now });
    expect(verified.ok).toBe(true);
    if (!verified.ok) throw new Error("fixture signature failed");
    expect(snapshotCredentialState(verified.payload, snapshot)).toBe("current");
    const refreshed = {
      ...snapshot,
      invitations: [
        { ...snapshot.invitations[0], invitationId, status: "rsvp_yes" as const, tokenVersion: 4 },
      ],
    };
    expect(snapshotCredentialState(verified.payload, refreshed)).toBe("replaced");
    expect(
      snapshotCredentialState(verified.payload, {
        ...snapshot,
        invitations: [{ invitationId, tokenVersion: 3, status: "revoked" }],
      }),
    ).toBe("revoked");
    expect(snapshotCredentialState(verified.payload, { ...snapshot, invitations: [] })).toBe(
      "unknown",
    );
  });
  it("shows stale evidence honestly without inventing disconnected revocations or a hard expiry", () => {
    expect(snapshotFreshness(snapshot, now + 5 * 60_000)).toEqual({
      ageMinutes: 5,
      refreshDue: true,
      stale: false,
    });
    expect(snapshotFreshness(snapshot, now + 30 * 60_000)).toEqual({
      ageMinutes: 30,
      refreshDue: true,
      stale: true,
    });
    expect(snapshotFreshness(snapshot, now + 3 * 60 * 60_000).stale).toBe(true);
  });
  it("excludes contacts and capability tokens and rejects duplicate invitation rows", () => {
    expect(credentialSnapshotSchema.safeParse(snapshot).success).toBe(true);
    expect(
      credentialSnapshotSchema.safeParse({
        ...snapshot,
        invitations: [{ ...snapshot.invitations[0], email: "guest@example.com" }],
      }).success,
    ).toBe(false);
    expect(credentialSnapshotSchema.safeParse({ ...snapshot, token: "capability" }).success).toBe(
      false,
    );
    expect(
      credentialSnapshotSchema.safeParse({
        ...snapshot,
        invitations: [...snapshot.invitations, ...snapshot.invitations],
      }).success,
    ).toBe(false);
  });
});
