import { expect, it, vi } from "vitest";
import { recordInvitationShare, undoInvitationShare } from "../server/share-tracking";
const actor = "7f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
it("rejects malformed identity, channel and actor before opening a transaction", async () => {
  const transaction = vi.fn();
  const command = { invitationId: actor, expectedVersion: 1, channel: "native", requestId: actor };
  expect(
    (
      await recordInvitationShare({ ...command, channel: "delivery-confirmed" }, actor, {
        transaction,
      })
    ).ok,
  ).toBe(false);
  expect((await recordInvitationShare(command, "forged", { transaction })).ok).toBe(false);
  expect(
    (await undoInvitationShare({ invitationId: actor, eventId: "wrong" }, actor, { transaction }))
      .ok,
  ).toBe(false);
  expect(transaction).not.toHaveBeenCalled();
});
