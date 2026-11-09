import { describe, expect, it } from "vitest";
import {
  invitationLifecycleCommandSchema,
  planInvitationLifecycle,
} from "../lib/invitation-lifecycle";

const invitationId = "6f1c2a4e-8b3d-4c5a-9e7f-1a2b3c4d5e6f";
const command = {
  invitationId,
  operation: "reissue" as const,
  expectedVersion: 3,
  expectedStatus: "rsvp_yes" as const,
  confirmation: "confirm" as const,
};
const current = { status: "rsvp_yes" as const, tokenVersion: 3, attending: true };

describe("invitation lifecycle intent", () => {
  it("requires explicit confirmation and rejects client-supplied audit identity or capability", () => {
    expect(invitationLifecycleCommandSchema.safeParse(command).success).toBe(true);
    expect(
      invitationLifecycleCommandSchema.safeParse({ ...command, confirmation: "" }).success,
    ).toBe(false);
    expect(
      invitationLifecycleCommandSchema.safeParse({ ...command, actor: "someone-else" }).success,
    ).toBe(false);
    expect(
      invitationLifecycleCommandSchema.safeParse({ ...command, token: "replacement" }).success,
    ).toBe(false);
  });
  it("reissues by rotating the capability and advancing the version while preserving attendance", () => {
    expect(planInvitationLifecycle(current, command)).toEqual({
      ok: true,
      status: "rsvp_yes",
      tokenVersion: 4,
      rotateToken: true,
    });
  });
  it("revokes without erasing or resetting the existing credential version", () => {
    expect(planInvitationLifecycle(current, { ...command, operation: "revoke" })).toEqual({
      ok: true,
      status: "revoked",
      tokenVersion: 3,
      rotateToken: false,
    });
  });
  it("rejects stale screens after another administrator reissues or revokes", () => {
    expect(planInvitationLifecycle({ ...current, tokenVersion: 4 }, command)).toEqual({
      ok: false,
      code: "conflict",
    });
    expect(planInvitationLifecycle({ ...current, status: "revoked" }, command)).toEqual({
      ok: false,
      code: "conflict",
    });
  });
  it.each([
    [true, "rsvp_yes"],
    [false, "rsvp_no"],
    [null, "sent"],
  ] as const)(
    "restores an explicitly reissued revoked invitation using its saved reply %s",
    (attending, status) => {
      expect(
        planInvitationLifecycle(
          { ...current, status: "revoked", attending },
          { ...command, expectedStatus: "revoked" },
        ),
      ).toEqual({ ok: true, status, tokenVersion: 4, rotateToken: true });
    },
  );
  it("does not create a second revocation or wrap a PostgreSQL integer version", () => {
    expect(
      planInvitationLifecycle(
        { ...current, status: "revoked" },
        { ...command, expectedStatus: "revoked", operation: "revoke" },
      ),
    ).toEqual({ ok: false, code: "already_revoked" });
    expect(
      planInvitationLifecycle(
        { ...current, tokenVersion: 2147483647 },
        { ...command, expectedVersion: 2147483647 },
      ),
    ).toEqual({ ok: false, code: "version_exhausted" });
  });
});
