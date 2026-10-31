import { describe, expect, it, vi } from "vitest";
import { submitRsvp } from "../server/submit-rsvp";
import { invitationSiteCopy } from "../lib/copy";

const token = "A".repeat(43);
describe("RSVP input and outcomes", () => {
  it.each(["yes", "no"] as const)("saves %s with the approved confirmation", async (attendance) => {
    const save = vi.fn().mockResolvedValue("saved");
    const result = await submitRsvp({ token, attendance }, save);
    expect(save).toHaveBeenCalledExactlyOnceWith(token, attendance === "yes");
    expect(result).toEqual({
      status: attendance,
      message: attendance === "yes" ? invitationSiteCopy.confirmed : invitationSiteCopy.declined,
    });
  });
  it.each([
    { token: "short", attendance: "yes" },
    { token, attendance: "true" },
    { token, attendance: null },
    { token, attendance: "yes", invitationId: "another-person" },
  ])("rejects malformed input without database work", async (input) => {
    const save = vi.fn();
    expect((await submitRsvp(input, save)).status).toBe("error");
    expect(save).not.toHaveBeenCalled();
  });
  it("returns the same neutral rejection for unavailable tokens", async () => {
    const result = await submitRsvp({ token, attendance: "yes" }, async () => "unavailable");
    expect(result).toEqual({
      status: "error",
      message: "This invitation is no longer available. Please contact the couple.",
    });
  });
  it("does not confirm a closed draft event", async () => {
    expect(await submitRsvp({ token, attendance: "yes" }, async () => "not-open")).toEqual({
      status: "error",
      message: "Replies aren’t open just yet. Please check back soon.",
    });
  });
  it("propagates outages to the action's safe error boundary", async () => {
    await expect(
      submitRsvp({ token, attendance: "yes" }, async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow("offline");
  });
});
