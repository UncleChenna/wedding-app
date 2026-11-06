import { expect, it } from "vitest";
import { parseMemories, memoriesCsv } from "../lib/memories";
const aggregate = {
  invitations: 100,
  repliedYes: 60,
  repliedNo: 10,
  attending: 120,
  admissions: 110,
  menu: [{ name: "Jollof rice", ordered: 80, served: 72 }],
};
it("drops non-allowlisted personal fields at every level", () => {
  const parsed = parseMemories({
    ...aggregate,
    email: "private@example.test",
    guestNames: ["Private Person"],
    dietaryNotes: "private note",
    menu: [{ ...aggregate.menu[0], phone: "+2348012345678", dietaryNotes: "private allergy" }],
  });
  expect(parsed).toEqual(aggregate);
  const csv = memoriesCsv(parsed);
  for (const secret of [
    "private@example.test",
    "Private Person",
    "private note",
    "+2348012345678",
    "private allergy",
  ])
    expect(csv).not.toContain(secret);
});
it("rejects negative, fractional and non-finite counts", () => {
  for (const value of [-1, 1.5, Infinity, NaN])
    expect(() => parseMemories({ ...aggregate, admissions: value })).toThrow();
});
it("quotes comma, quote and newline characters in menu labels", () => {
  expect(
    memoriesCsv({ ...aggregate, menu: [{ name: 'Rice, "special"\nmeal', ordered: 2, served: 1 }] }),
  ).toContain('"Rice, ""special""\nmeal"');
});
it.each(["=SUM(A1:A2)", "+cmd", "-cmd", "@cmd", "  =cmd", "\tcmd"])(
  "neutralizes spreadsheet formulas: %s",
  (name) => {
    expect(memoriesCsv({ ...aggregate, menu: [{ name, ordered: 2, served: 1 }] })).toContain(
      `"'${name}"`,
    );
  },
);
it("includes aggregate counts and a stable export header", () => {
  const csv = memoriesCsv(aggregate);
  expect(csv).toContain('"Category","Label","Count","Served"\r\n');
  expect(csv).toContain('"RSVP","Yes","60",""');
  expect(csv).toContain('"Menu","Jollof rice","80","72"');
});
