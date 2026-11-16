import { describe, expect, it } from "vitest";
import { parseGuestImportCsv, guestImportErrorsCsv } from "../lib/guest-import";
const header = "name,phone,email,party size,side,table\r\n";
describe("guest CSV parsing", () => {
  it("uses spreadsheet formula protection for error exports", () => {
    expect(guestImportErrorsCsv([{ row: 2, column: "=formula", message: "unsafe" }])).toContain(
      "'=formula",
    );
  });
  it("creates one invitation per row with named guest and plus-one allowance", () => {
    const result = parseGuestImportCsv(
      header + '\"Ada, Ọma\",,+ada@example.com,3,bride,\r\n\"Uche\nExample\",,,1,groom,',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.parties).toHaveLength(2);
      expect(result.parties[0]?.maxTagAlongs).toBe(2);
      expect(result.parties[0]?.members[0]?.name).toBe("Ada, Ọma");
      expect(result.parties[1]?.members[0]?.name).toBe("Uche\nExample");
      expect(result.parties[0]).not.toHaveProperty("householdName");
    }
  });
  it("rejects obsolete household headers with actionable guidance", () => {
    const result = parseGuestImportCsv(
      "name,phone,email,party size,side,table,household\nAda,,,2,,,Old label",
    );
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors[0]?.message).toContain("Remove the obsolete household column");
  });
  it.each(['"broken', 'Ada"bad,,,1,,', '"Ada"x,,,1,,'])("rejects malformed quotes: %s", (row) => {
    expect(parseGuestImportCsv(header + row).ok).toBe(false);
  });
  it("rejects missing and duplicate headers", () => {
    expect(parseGuestImportCsv("name,name\nAda,Ada").ok).toBe(false);
    expect(
      parseGuestImportCsv("name,phone,email,party size,side,table,name\nAda,,,1,,,Ada").ok,
    ).toBe(false);
  });
  it("validates contacts and tag-along bounds without conflating equal guest names", () => {
    for (const row of ["Ada,no,invalid,1,,", "Ada,,,12,,", "Ada,,,0,,"])
      expect(parseGuestImportCsv(header + row).ok).toBe(false);
    const result = parseGuestImportCsv(header + "Ada,,,2,,\nAda,,,2,,");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.parties).toHaveLength(2);
  });
  it("preserves formula-looking names and rejects shared contacts across invitations", () => {
    expect(parseGuestImportCsv(header + "=SUM(A1),,,1,,").ok).toBe(true);
    expect(
      parseGuestImportCsv(header + "Ada,,ada@example.com,1,,\nUche,,ADA@example.com,1,,").ok,
    ).toBe(false);
  });
  it("caps rows and bytes", () => {
    expect(parseGuestImportCsv(header + "Ada,,,1,,\n".repeat(301)).ok).toBe(false);
    expect(parseGuestImportCsv("a".repeat(262145)).ok).toBe(false);
  });
});
