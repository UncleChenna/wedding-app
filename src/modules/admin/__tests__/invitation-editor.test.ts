import { describe, expect, it } from "vitest";
import { invitationEditorSchema, planDraftInvitation } from "../lib/invitation-editor";

const input = {
  householdName: " Ada & Uchenna ",
  side: "Bride",
  tableId: "",
  maxTagAlongs: "1",
  members: [{ id: "", name: "Ada", email: "ada@example.test", phone: "07700 900123" }],
};

describe("invitation editor", () => {
  it("normalizes contacts and creates a draft using a fresh generated token", () => {
    const data = invitationEditorSchema.parse(input);
    const draft = planDraftInvitation(data, () => "unique-secure-token");
    expect(draft).toMatchObject({
      status: "draft",
      token: "unique-secure-token",
      tokenVersion: 1,
      householdName: "Ada & Uchenna",
      maxTagAlongs: 1,
    });
    expect(data.members[0]).toMatchObject({ phone: "+447700900123", email: "ada@example.test" });
  });
  it("returns precise phone/email field errors and rejects injected lifecycle fields", () => {
    const result = invitationEditorSchema.safeParse({
      ...input,
      members: [{ id: "", name: "Ada", email: "wrong", phone: "call me" }],
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining(["members.0.phone", "members.0.email"]),
      );
    expect(invitationEditorSchema.safeParse({ ...input, status: "sent" }).success).toBe(false);
  });
  it("requires a named member and bounded allowance; optional contacts become null", () => {
    expect(invitationEditorSchema.safeParse({ ...input, members: [] }).success).toBe(false);
    for (const maxTagAlongs of ["", "-1", "11", "1.2"])
      expect(invitationEditorSchema.safeParse({ ...input, maxTagAlongs }).success).toBe(false);
    const data = invitationEditorSchema.parse({
      ...input,
      members: [{ id: "", name: "Ada", phone: "", email: "" }],
    });
    expect(data.members[0]).toMatchObject({ phone: null, email: null });
  });
  it("rejects duplicate persisted member IDs", () => {
    const member = { ...input.members[0], id: "11111111-1111-4111-8111-111111111111" };
    expect(invitationEditorSchema.safeParse({ ...input, members: [member, member] }).success).toBe(
      false,
    );
  });
});
