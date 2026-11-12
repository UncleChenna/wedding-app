import { describe, expect, it } from "vitest";
import { manualHouseholdName, searchGuestNames } from "../lib/manual-search";
import { manualMatchesSchema } from "../lib/manual-checkin";

const rows = [
  { invitationId: "a", name: "Adébayo household", names: ["Ada Adébayo", "Chidi Okafor"] },
  { invitationId: "b", name: "Ada and friends", names: ["Ada Nwosu", "Ife Nwosu"] },
  { invitationId: "c", name: "Other", names: ["Bola Lawal"] },
] as const;
describe("manual guest name search", () => {
  it("uses readable household fallbacks and concise labels for ordinary families", () => {
    expect(manualHouseholdName([], "  Okafor family  ")).toBe("Okafor family");
    expect(manualHouseholdName([], null)).toBe("Guest household");
    expect(manualHouseholdName([], "  ")).toBe("Guest household");
    expect(manualHouseholdName(["Ada", "Chidi"], null)).toBe("Ada & Chidi");
    expect(manualHouseholdName(["Ada", "Chidi", "Ife"], null)).toBe("Ada & Chidi & household");
  });
  it("ranks exact names before prefixes and one-edit typos, without duplicate households", () => {
    const candidates = [
      { invitationId: "prefix", name: "Bola family", names: ["Adalena"] },
      { invitationId: "exact", name: "Ada family", names: ["Ada"] },
      { invitationId: "exact", name: "Repeated row", names: ["Ada"] },
    ];
    expect(searchGuestNames(candidates, "ada").matches.map((match) => match.invitationId)).toEqual([
      "exact",
      "prefix",
    ]);
    for (const query of ["adebayoa", "adebaayo", "adebaxo"])
      expect(searchGuestNames(rows, query).matches[0]?.invitationId).toBe("a");
    expect(searchGuestNames(rows, "axebaxo").matches).toEqual([]);
    expect(searchGuestNames(rows, "Ada\u200b").matches).toEqual([]);
  });
  it("bounds long household display labels while preserving all primary names for matching", () => {
    const names = ["Ada " + "x".repeat(250), "Chidi " + "y".repeat(250), "Ife Okafor"];
    const name = manualHouseholdName(names, null);
    const result = searchGuestNames(
      [{ invitationId: "550e8400-e29b-41d4-a716-446655440000", name, names }],
      "Ife",
    );
    expect(result.matches[0]?.matchedName).toBe("Ife Okafor");
    expect(name.length).toBeLessThanOrEqual(512);
    expect(manualMatchesSchema.safeParse({ state: "matches", ...result }).success).toBe(true);
  });
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
