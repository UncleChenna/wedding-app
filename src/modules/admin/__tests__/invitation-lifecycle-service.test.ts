import { describe, expect, it, vi } from "vitest";
import { changeInvitationLifecycle } from "../server/invitation-lifecycle";

const command = {
  invitationId: "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f",
  operation: "reissue",
  expectedStatus: "sent",
  expectedVersion: 1,
  confirmation: "confirm",
};
const actor = "7f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";

describe("invitation lifecycle persistence boundary", () => {
  it("rejects malformed commands and actors before opening a transaction", async () => {
    const transaction = vi.fn();
    expect(
      await changeInvitationLifecycle({ transaction }, { ...command, confirmation: "" }, actor),
    ).toEqual({ ok: false, code: "invalid_input" });
    expect(await changeInvitationLifecycle({ transaction }, command, "unverified")).toEqual({
      ok: false,
      code: "invalid_input",
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it("bounds retries for an invitation capability uniqueness collision", async () => {
    const transaction = vi.fn().mockRejectedValue(
      new Error("query failed", {
        cause: { code: "23505", constraint_name: "invitations_token_unique" },
      }),
    );
    expect(await changeInvitationLifecycle({ transaction }, command, actor)).toEqual({
      ok: false,
      code: "token_exhausted",
    });
    expect(transaction).toHaveBeenCalledTimes(5);
  });

  it.each([
    { code: "23505", constraint_name: "unrelated_unique" },
    { code: "08006", message: "connection lost" },
    { code: "23514", constraint_name: "invitation_lifecycle_transition" },
  ])("does not retry unrelated persistence failures", async (failure) => {
    const transaction = vi.fn().mockRejectedValue(failure);
    await expect(changeInvitationLifecycle({ transaction }, command, actor)).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
