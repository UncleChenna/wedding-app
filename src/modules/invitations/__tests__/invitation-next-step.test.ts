import { describe, expect, it } from "vitest";
import { invitationNextStep } from "../lib/invitation-next-step";

describe("invitation next step", () => {
  it.each([
    [null, "reply"],
    ["yes", "pass"],
    ["no", "closing"],
  ] as const)("gives %s its own next step", (attendance, step) => {
    expect(
      invitationNextStep(
        attendance,
        "2026-12-19",
        "Africa/Lagos",
        new Date("2026-12-18T12:00:00Z"),
      ),
    ).toEqual({ step, showOrdering: false });
  });
  it("uses the venue calendar date at midnight, not the server date", () => {
    expect(
      invitationNextStep("yes", "2026-12-19", "Africa/Lagos", new Date("2026-12-18T22:59:59Z"))
        .showOrdering,
    ).toBe(false);
    expect(
      invitationNextStep("yes", "2026-12-19", "Africa/Lagos", new Date("2026-12-18T23:00:00Z"))
        .showOrdering,
    ).toBe(true);
    expect(
      invitationNextStep(null, "2026-12-19", "Africa/Lagos", new Date("2026-12-20T12:00:00Z"))
        .showOrdering,
    ).toBe(true);
  });
  it("does not guess the venue date while its time zone is undecided", () => {
    expect(
      invitationNextStep("yes", "2026-12-19", null, new Date("2026-12-20T12:00:00Z")).showOrdering,
    ).toBe(false);
  });
});
