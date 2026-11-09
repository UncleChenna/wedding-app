import { expect, it } from "vitest";
import { admissionRequestSchema, sameOnlineAdmission } from "../lib/online-admission";
const actor = { staffId: "gate", deviceId: "scanner" };
const request = { invitationId: "invitation", people: 2 };
const stored = {
  staffId: "gate",
  deviceId: "scanner",
  invitationId: "invitation",
  source: "online",
  result: "valid",
  reportedPeople: 2,
  admittedPeople: 2,
  conflict: false,
};
it("recognizes only the same committed online intent from the same authenticated actor", () => {
  expect(sameOnlineAdmission(stored, actor, request)).toBe(true);
});
it.each([
  { staffId: "other" },
  { deviceId: "other" },
  { invitationId: "other" },
  { source: "offline" },
  { result: "invalid" },
  { reportedPeople: 3 },
  { admittedPeople: 1 },
  { conflict: true },
  { invitationId: null },
])("refuses a reused event identity with different immutable evidence %s", (change) => {
  expect(sameOnlineAdmission({ ...stored, ...change }, actor, request)).toBe(false);
});
it.each([0, -1, 0.5, NaN, Infinity, 2147483648])(
  "rejects impossible arrival count %s before storage",
  (people) => {
    expect(
      admissionRequestSchema.safeParse({
        clientEventId: "550e8400-e29b-41d4-a716-446655440000",
        qr: "signed pass",
        people,
      }).success,
    ).toBe(false);
  },
);
it("accepts a bounded positive request and rejects caller-supplied identity fields", () => {
  const input = {
    clientEventId: "550e8400-e29b-41d4-a716-446655440000",
    qr: "signed pass",
    people: 2,
  };
  expect(admissionRequestSchema.safeParse(input).success).toBe(true);
  expect(admissionRequestSchema.safeParse({ ...input, staffId: "forged" }).success).toBe(false);
  expect(admissionRequestSchema.safeParse({ ...input, clientEventId: "bad" }).success).toBe(false);
  expect(admissionRequestSchema.safeParse({ ...input, qr: "x".repeat(4097) }).success).toBe(false);
});
