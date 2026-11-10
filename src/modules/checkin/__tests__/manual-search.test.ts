import { describe, expect, it } from "vitest";
import { searchGuestNames } from "../lib/manual-search";

const rows = [
  { invitationId: "a", name: "Adébayo household", names: ["Ada Adébayo", "Chidi Okafor"] },
  { invitationId: "b", name: "Ada and friends", names: ["Ada Nwosu", "Ife Nwosu"] },
  { invitationId: "c", name: "Other", names: ["Bola Lawal"] },
] as const;
describe("manual guest name search", () => {
  it.each(["Adebayo", "adebayo", "Adébayo", "Adebayo Ada", "adebyo"])(
    "finds the same primary guest for %s",
    (query) =>
      expect(searchGuestNames(rows, query).matches.map((row) => row.invitationId)).toEqual(["a"]),
  );
  it("finds tag-alongs and requires each query token in one name or household label", () => {
    expect(searchGuestNames(rows, "okafor chidi").matches[0]?.invitationId).toBe("a");
    expect(searchGuestNames(rows, "ada chidi").matches).toEqual([]);
  });
  it("keeps equal-name households distinct and caps broad results", () => {
    const many = Array.from({ length: 30 }, (_, index) => ({
      ...rows[0],
      invitationId: String(index),
    }));
    const result = searchGuestNames(many, "ada");
    expect(result.matches).toHaveLength(10);
    expect(new Set(result.matches.map((row) => row.invitationId)).size).toBe(10);
    expect(result.hasMore).toBe(true);
  });
  it("rejects empty/too short/oversized searches instead of returning the directory", () => {
    for (const query of ["", " ", "a", "é", "x".repeat(201)])
      expect(searchGuestNames(rows, query).matches).toEqual([]);
  });
  it("does not fuzzy-match short unrelated names or leak extra input columns", () => {
    expect(searchGuestNames(rows, "ace").matches).toEqual([]);
    const result = searchGuestNames([{ ...rows[0], privateNote: "SECRET" }], "adebayo");
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });
});
