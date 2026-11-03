import { describe, expect, it, vi } from "vitest";

import { resolveInvitation } from "../server/resolve-invitation";

const token = "a".repeat(43);
const stored = {
  status: "sent" as const,
  householdName: "Ada's family",
  primaryNames: ["Ada"],
  id: "private-id",
  notes: "Private staff note",
  phone: "+44123456789",
};

describe("personal invitation resolution", () => {
  it("returns only the guest-facing fields for a valid invitation", async () => {
    const find = vi.fn().mockResolvedValue(stored);
    expect(await resolveInvitation(token, find)).toEqual({
      attendance: null,
      householdName: "Ada's family",
      primaryNames: ["Ada"],
    });
    expect(find).toHaveBeenCalledWith(token);
  });

  it.each(["sent", "rsvp_yes", "rsvp_no"])("resolves %s invitations", async (status) => {
    expect(
      await resolveInvitation(token, vi.fn().mockResolvedValue({ ...stored, status })),
    ).not.toBeNull();
  });

  it.each([null, { ...stored, status: "revoked" }, { ...stored, status: "draft" }])(
    "returns the same absence result for unknown or unpublished invitations",
    async (record) => {
      expect(await resolveInvitation(token, vi.fn().mockResolvedValue(record))).toBeNull();
    },
  );

  it("does not query for malformed tokens", async () => {
    const find = vi.fn();
    expect(await resolveInvitation("not a token", find)).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });

  it("does not disguise an outage as an unknown invitation", async () => {
    const failure = new Error("database unavailable");
    await expect(resolveInvitation(token, vi.fn().mockRejectedValue(failure))).rejects.toBe(
      failure,
    );
  });
});
