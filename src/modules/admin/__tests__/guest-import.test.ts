import { describe, expect, it } from "vitest";
import { parseGuestImportCsv, guestImportErrorsCsv } from "../lib/guest-import";

const header = "name,phone,email,party size,side,table,household\r\n";
describe("guest CSV parsing", () => {
  it("uses the shared spreadsheet formula protection for error exports", () => {
    expect(guestImportErrorsCsv([{ row: 2, column: "=formula", message: "\tunsafe" }])).toContain(
      '"\'=formula","\'\tunsafe"',
    );
  });
  it("groups named members with quoted commas/newlines and Unicode", () => {
    const result = parseGuestImportCsv(
      header +
        '"Ada, Ọma",,+ada@example.com,3,bride,,"Family\nOne"\r\nUche,,,3,bride,,"Family\nOne"',
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.households).toHaveLength(1);
      expect(result.households[0]?.maxTagAlongs).toBe(1);
      expect(result.households[0]?.members[0]?.name).toBe("Ada, Ọma");
    }
  });
  it.each(['"broken', 'Ada"bad,,,1,,,', '"Ada"x,,,1,,,'])("rejects malformed quotes: %s", (row) => {
    expect(parseGuestImportCsv(header + row).ok).toBe(false);
  });
  it("rejects missing/duplicate headers and inconsistent grouping", () => {
    expect(parseGuestImportCsv("name,name\nAda,Ada").ok).toBe(false);
    const result = parseGuestImportCsv(header + "Ada,,,2,bride,,Family\nUche,,,3,groom,,Family");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.row === 3)).toBe(true);
  });
  it("validates contacts, duplicate members and tag-along bounds", () => {
    for (const row of ["Ada,no,invalid,1,,,", "Ada,,,12,,,", "Ada,,,0,,,"])
      expect(parseGuestImportCsv(header + row).ok).toBe(false);
    expect(parseGuestImportCsv(header + "Ada,,,2,,,Family\nAda,,,2,,,Family").ok).toBe(false);
  });
  it("preserves formula-looking names as data and rejects shared contacts across households", () => {
    const result = parseGuestImportCsv(header + "=SUM(A1),,,1,,,");
    expect(result.ok).toBe(true);
    expect(
      parseGuestImportCsv(header + "Ada,,ada@example.com,1,,,\nUche,,ada@example.com,1,,,").ok,
    ).toBe(false);
  });
  it("caps rows and bytes", () => {
    expect(parseGuestImportCsv(header + "Ada,,,1,,,\n".repeat(301)).ok).toBe(false);
    expect(parseGuestImportCsv("a".repeat(262145)).ok).toBe(false);
  });
});
