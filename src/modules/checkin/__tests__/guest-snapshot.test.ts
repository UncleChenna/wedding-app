import { describe, expect, it } from "vitest";
import { parseGuestSnapshot, guestSnapshotFreshness } from "../lib/guest-snapshot";

const now = Date.UTC(2026, 11, 19, 12);
export const snapshotFixture = () => ({
  version: 1 as const,
  session: "a".repeat(64),
  generatedAt: now,
  expiresAt: now + 86_400_000,
  keys: [{ kid: "test", alg: "Ed25519" as const, spki: "MCowBQYDK2VwAyEA" + "A".repeat(43) }],
  invitations: [
    {
      invitationId: "11111111-1111-4111-8111-111111111111",
      tokenVersion: 1,
      status: "rsvp_yes" as const,
      attending: true,
      partySize: 3,
      admittedSoFar: 1,
      name: "Synthetic household",
      names: ["Synthetic guest"],
      tableNumber: 7,
    },
  ],
});

describe("minimal private guest snapshot", () => {
  it("accepts only the bounded scanner projection", () => {
    expect(parseGuestSnapshot(snapshotFixture())).toEqual(snapshotFixture());
  });
  it.each(["email", "phone", "dietaryNotes", "token", "message"])(
    "rejects private extra %s fields",
    (field) => {
      const value = snapshotFixture();
      expect(parseGuestSnapshot({ ...value, [field]: "private" })).toBeNull();
      expect(
        parseGuestSnapshot({
          ...value,
          invitations: [{ ...value.invitations[0], [field]: "private" }],
        }),
      ).toBeNull();
    },
  );
  it("rejects duplicate invitations and signing keys", () => {
    const value = snapshotFixture();
    expect(
      parseGuestSnapshot({ ...value, invitations: [...value.invitations, ...value.invitations] }),
    ).toBeNull();
    expect(parseGuestSnapshot({ ...value, keys: [...value.keys, ...value.keys] })).toBeNull();
  });
  it("rejects malformed envelopes and bounded collections", () => {
    const value = snapshotFixture();
    for (const input of [
      null,
      [],
      {},
      { ...value, version: 2 },
      { ...value, session: "invalid" },
      { ...value, generatedAt: Number.NaN },
      { ...value, expiresAt: now },
      { ...value, keys: [] },
      { ...value, keys: Array(17).fill(value.keys[0]) },
      { ...value, keys: [null] },
      { ...value, keys: [{ ...value.keys[0], alg: "RSA" }] },
      { ...value, keys: [{ ...value.keys[0], kid: "INVALID" }] },
      { ...value, keys: [{ ...value.keys[0], spki: "private-key" }] },
      { ...value, invitations: "invalid" },
      { ...value, invitations: Array(10_001).fill(value.invitations[0]) },
      { ...value, invitations: [null] },
    ])
      expect(parseGuestSnapshot(input)).toBeNull();
  });
  it("rejects malformed household fields without coercing status or counts", () => {
    const value = snapshotFixture();
    for (const patch of [
      { invitationId: "invalid" },
      { tokenVersion: 0 },
      { tokenVersion: 1.5 },
      { status: ["rsvp_yes"] },
      { status: "unknown" },
      { attending: "yes" },
      { partySize: -1 },
      { admittedSoFar: 4 },
      { tableNumber: 0 },
      { name: " " },
      { name: "a".repeat(513) },
      { name: "Hidden\u0000name" },
      { names: "invalid" },
      { names: Array(1001).fill("Guest") },
      { names: ["a".repeat(201)] },
    ])
      expect(
        parseGuestSnapshot({ ...value, invitations: [{ ...value.invitations[0], ...patch }] }),
      ).toBeNull();
    expect(
      parseGuestSnapshot({
        ...value,
        invitations: [1, 2, 3].map((n) => ({
          ...value.invitations[0],
          invitationId: `${String(n).repeat(8)}-1111-4111-8111-111111111111`,
          names: Array(1000).fill("a".repeat(200)),
        })),
      }),
    ).toBeNull();
  });
  it("warns after thirty minutes without inventing a hard snapshot age expiry", () => {
    const value = snapshotFixture();
    expect(guestSnapshotFreshness(value, now + 5 * 60_000)).toMatchObject({
      refreshDue: true,
      stale: false,
      expired: false,
    });
    expect(guestSnapshotFreshness(value, now + 30 * 60_000)).toMatchObject({
      ageMinutes: 30,
      stale: true,
      expired: false,
    });
    expect(guestSnapshotFreshness(value, now + 12 * 3_600_000)).toMatchObject({
      stale: true,
      expired: false,
    });
    expect(guestSnapshotFreshness(value, value.expiresAt)).toMatchObject({ expired: true });
  });
});

it("accepts v2 original-actor IDs while retaining strictly read-only v1 compatibility", () => {
  const actor = { staffId: "22222222-2222-4222-8222-222222222222", deviceId: "b".repeat(64) };
  const value = { ...snapshotFixture(), version: 2, actor };
  expect(parseGuestSnapshot(value)).toEqual(value);
  expect(parseGuestSnapshot(snapshotFixture())).not.toHaveProperty("actor");
  expect(parseGuestSnapshot({ ...snapshotFixture(), actor })).toBeNull();
  for (const invalid of [
    null,
    {},
    { ...actor, email: "private@example.test" },
    { ...actor, staffId: "invalid" },
    { ...actor, deviceId: "credential" },
  ])
    expect(parseGuestSnapshot({ ...value, actor: invalid })).toBeNull();
});
