import { describe, expect, it } from "vitest";
import { validateParty } from "../lib/party";

const primaryId = "00000000-0000-4000-8000-000000000001";
const otherId = "00000000-0000-4000-8000-000000000002";
const mealId = "00000000-0000-4000-8000-000000000003";
const person = { id: primaryId, name: "Ada", mealChoice: mealId, dietaryNotes: "" };
const stored = [{ ...person, isPrimary: true }];
const meals = [{ id: mealId, name: "Rice" }];
const extra = { ...person, id: "", name: "Uche" };

describe("party validation", () => {
  it("derives attendance from named people and trims guest input", () => {
    const result = validateParty([{ ...person, name: " Ada " }, extra], stored, 1, meals);
    expect(result).toMatchObject({
      ok: true,
      countAttending: 2,
      people: [{ name: "Ada" }, { name: "Uche" }],
    });
  });
  it("enforces the current invitation limit instead of a client count", () => {
    expect(validateParty([person, extra, extra], stored, 1, meals)).toMatchObject({ ok: false });
    expect(validateParty([person], stored, 0, meals)).toMatchObject({
      ok: true,
      countAttending: 1,
    });
  });
  it("rejects blank names and oversized dietary notes", () => {
    expect(validateParty([{ ...person, name: "  " }], stored, 1, meals)).toMatchObject({
      ok: false,
    });
    expect(
      validateParty([{ ...person, dietaryNotes: "a".repeat(1001) }], stored, 1, meals),
    ).toMatchObject({ ok: false });
  });
  it("rejects foreign and repeated guest identifiers", () => {
    expect(validateParty([{ ...person, id: otherId }], stored, 1, meals)).toMatchObject({
      ok: false,
    });
    expect(validateParty([person, person], stored, 1, meals)).toMatchObject({ ok: false });
  });
  it("cannot remove or demote an invited primary guest", () => {
    expect(validateParty([extra], stored, 1, meals)).toMatchObject({ ok: false });
    expect(validateParty([], stored, 1, meals)).toMatchObject({ ok: false });
  });
  it("requires a real offered meal when meals are available", () => {
    expect(validateParty([{ ...person, mealChoice: "" }], stored, 1, meals)).toMatchObject({
      ok: false,
    });
    expect(validateParty([{ ...person, mealChoice: otherId }], stored, 1, meals)).toMatchObject({
      ok: false,
    });
  });
  it("lets guests retain an existing unavailable meal but not assign it to somebody else", () => {
    expect(validateParty([person], stored, 1, [])).toMatchObject({ ok: true });
    expect(validateParty([person, extra], stored, 1, [])).toMatchObject({ ok: false });
  });
  it("allows meal details to follow when no meals are published", () => {
    expect(validateParty([{ ...person, mealChoice: "" }], stored, 1, [])).toMatchObject({
      ok: true,
    });
  });
  it("creates a primary person when an invitation has no existing guest rows", () => {
    expect(validateParty([extra], [], 0, meals)).toMatchObject({
      ok: true,
      countAttending: 1,
      people: [{ isPrimary: true }],
    });
    expect(validateParty([extra, extra], [], 0, meals)).toMatchObject({ ok: false });
  });
  it("counts multiple existing primary guests independently from tag-along capacity", () => {
    const second = { ...person, id: otherId };
    expect(
      validateParty([person, second, extra], [...stored, { ...second, isPrimary: true }], 1, meals),
    ).toMatchObject({ ok: true, countAttending: 3 });
  });
  it("rejects attempts to supply authoritative server fields", () => {
    expect(validateParty([{ ...person, isPrimary: false }], stored, 1, meals)).toMatchObject({
      ok: false,
    });
  });
});
