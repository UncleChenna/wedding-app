import { describe, expect, it, vi } from "vitest";
import { resolvePassIdentity } from "../server/pass-identity";
const token = "a".repeat(43);
const id = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
describe("personal credential to pass identity", () => {
  it("rejects malformed credentials without a lookup", async () => {
    const find = vi.fn();
    expect(await resolvePassIdentity("not a credential", find)).toBeNull();
    expect(find).not.toHaveBeenCalled();
  });
  it.each(["draft", "sent", "rsvp_no", "revoked"])(
    "rejects %s even with a real credential",
    async (status) => {
      expect(
        await resolvePassIdentity(token, vi.fn().mockResolvedValue({ id, status })),
      ).toBeNull();
    },
  );
  it("rejects unknown credentials", async () => {
    expect(await resolvePassIdentity(token, vi.fn().mockResolvedValue(null))).toBeNull();
  });
  it("returns only the authorized accepted identity", async () => {
    const find = vi
      .fn()
      .mockResolvedValue({ id, status: "rsvp_yes", tokenVersion: 3, token, phone: "private" });
    expect(await resolvePassIdentity(token, find)).toEqual({ id, tokenVersion: 3 });
    expect(find).toHaveBeenCalledWith(token);
  });
  it("does not hide database outages as absence", async () => {
    await expect(
      resolvePassIdentity(token, vi.fn().mockRejectedValue(new Error("offline"))),
    ).rejects.toThrow("offline");
  });
});
