import { describe, expect, it } from "vitest";
import { memberRsvpInputSchema, rsvpFingerprint, repliesAllowed } from "../lib/member-rsvp";

const guestId = "11111111-1111-4111-8111-111111111111";
const input = {
  expectedRevision: 0,
  requestId: "22222222-2222-4222-8222-222222222222",
  members: [{ guestId, attendance: "yes", dietaryNotes: "No nuts" }],
};
describe("member RSVP boundary", () => {
  it("accepts mixed responses without deriving people from contacts or names", () => {
    expect(
      memberRsvpInputSchema.parse({
        ...input,
        members: [
          ...input.members,
          { guestId: "33333333-3333-4333-8333-333333333333", attendance: "no", dietaryNotes: "" },
        ],
      }).members,
    ).toHaveLength(2);
  });
  it.each([
    { ...input, members: [...input.members, ...input.members] },
    { ...input, expectedRevision: -1 },
    { ...input, members: [] },
    { ...input, requestId: "not-an-id" },
    { ...input, members: [{ ...input.members[0], dietaryNotes: "x".repeat(2001) }] },
    { ...input, invitationId: "caller cannot choose identity" },
  ])("rejects invalid or ambiguous input", (value) => {
    expect(memberRsvpInputSchema.safeParse(value).success).toBe(false);
  });
  it("fingerprints content rather than member order or retry identifier", () => {
    const other = {
      guestId: "33333333-3333-4333-8333-333333333333",
      attendance: "no" as const,
      dietaryNotes: "",
    };
    const first = memberRsvpInputSchema.parse({ ...input, members: [...input.members, other] });
    const retry = {
      ...first,
      requestId: "44444444-4444-4444-8444-444444444444",
      members: [...first.members].reverse(),
    };
    expect(rsvpFingerprint(first)).toBe(rsvpFingerprint(retry));
    expect(rsvpFingerprint(first)).not.toBe(rsvpFingerprint({ ...first, expectedRevision: 1 }));
    const firstMember = first.members[0];
    if (!firstMember) throw new Error("Missing fixture member");
    expect(rsvpFingerprint(first)).not.toBe(
      rsvpFingerprint({
        ...first,
        members: [{ ...firstMember, dietaryNotes: "Changed" }, other],
      }),
    );
  });
  it("locks at the exact cutoff and permits only an unexpired explicit reopening", () => {
    const cutoff = new Date("2026-12-19T00:00:00Z");
    expect(repliesAllowed(cutoff, null, new Date(cutoff.getTime() - 1))).toBe(true);
    expect(repliesAllowed(cutoff, null, cutoff)).toBe(false);
    expect(repliesAllowed(cutoff, new Date(cutoff.getTime() + 1000), cutoff)).toBe(true);
    expect(repliesAllowed(cutoff, cutoff, cutoff)).toBe(false);
    expect(repliesAllowed(null, null, cutoff)).toBe(true);
  });
});
