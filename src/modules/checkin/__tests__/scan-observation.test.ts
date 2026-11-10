import { describe, expect, it } from "vitest";
import { observationResult, observationInputSchema } from "../lib/scan-observation";

describe("scan observation evidence", () => {
  it.each([
    ["valid", "valid"],
    ["already_used", "already_used"],
    ["invalid", "invalid"],
    ["revoked", "revoked"],
    ["not_rsvped", "not_rsvped"],
    ["replaced", "revoked"],
    ["unknown", "invalid"],
    ["unavailable", null],
    ["session_expired", null],
  ] as const)("maps %s without inventing a successful admission", (state, result) => {
    expect(observationResult(state)).toBe(result);
  });
  it("rejects private or caller-controlled identity/count fields", () => {
    const value = {
      invitationId: null,
      result: "invalid",
      inputMethod: "qr",
      reportedAt: new Date(),
    };
    expect(observationInputSchema.safeParse(value).success).toBe(true);
    for (const key of [
      "qr",
      "pin",
      "dietaryNotes",
      "staffId",
      "deviceId",
      "admittedPeople",
      "source",
    ])
      expect(observationInputSchema.safeParse({ ...value, [key]: "private" }).success).toBe(false);
    expect(observationInputSchema.safeParse({ ...value, inputMethod: "forged" }).success).toBe(
      false,
    );
    expect(observationInputSchema.safeParse({ ...value, invitationId: "not-uuid" }).success).toBe(
      false,
    );
    expect(observationInputSchema.safeParse({ ...value, reportedAt: new Date(NaN) }).success).toBe(
      false,
    );
  });
});
