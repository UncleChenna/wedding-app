import { describe, expect, it } from "vitest";
import {
  guestExportCsv,
  parseGuestExportFilters,
  type ExportInvitation,
} from "../lib/guest-export";
import { guestExportSearch } from "../lib/guest-export-query";

const row: ExportInvitation = {
  id: "a",
  name: "Ada household",
  status: "rsvp_yes",
  tokenVersion: 1,
  countAttending: 2,
  sentAt: null,
  side: "none",
  tableId: null,
  tableNumber: null,
  guests: [
    { id: "g1", name: "Uchenna", isPrimary: true, meal: "Rice", dietaryNotes: "No nuts" },
    { id: "g2", name: "Ada", isPrimary: false, meal: "Fish", dietaryNotes: "" },
  ],
};

describe("filtered private guest CSV", () => {
  it("accepts long filters supported by the list without silently broadening them", () => {
    const filters = { query: "Ada ".repeat(300), side: "Family".repeat(400) };
    expect(parseGuestExportFilters(guestExportSearch(filters))).toEqual({
      success: true,
      data: filters,
    });
  });
  it("round trips unassigned values separately from a literal side named none", () => {
    for (const side of [undefined, null, "none", "value:family"]) {
      const filters = {
        query: "Ada Uchenna",
        status: "rsvp_yes" as const,
        sent: "unsent" as const,
        side,
        tableId: null,
      };
      expect(parseGuestExportFilters(guestExportSearch(filters))).toEqual({
        success: true,
        data: filters,
      });
    }
  });
  it("rejects malformed, unknown and duplicated filters instead of exporting everything", () => {
    for (const query of [
      "status=oops",
      "sent=yes",
      "side=none&side=value:family",
      "table=value:bad",
      "extra=yes",
    ]) {
      expect(parseGuestExportFilters(new URLSearchParams(query)).success).toBe(false);
    }
  });
  it("matches combined household filters and retains every member of a matching household", () => {
    const csv = guestExportCsv([row, { ...row, id: "b", name: "Other", side: null, guests: [] }], {
      query: "household Uchenna",
      status: "rsvp_yes",
      sent: "unsent",
      side: "none",
      tableId: null,
    });
    expect(csv).toContain('"Uchenna"');
    expect(csv).toContain('"Ada"');
    expect(csv).toContain('"Rice","No nuts"');
    expect(csv).not.toContain('"Other"');
    expect(csv.split("\r\n")).toHaveLength(4);
    expect(guestExportCsv([row], { sent: "sent" }).split("\r\n")).toHaveLength(2);
  });
  it("escapes spreadsheet formulas, whitespace prefixes, quotes and multiline values", () => {
    for (const value of [
      "=1+1",
      "+SUM(A1)",
      "-1+1",
      "@cmd",
      "  =1",
      "\ttext",
      "\rtext",
      "\ntext",
    ]) {
      const csv = guestExportCsv([{ ...row, name: value }], {});
      expect(csv).toContain(`"'${value}"`);
    }
    const csv = guestExportCsv(
      [
        {
          ...row,
          name: 'Ada, "family"',
          guests: [
            {
              id: "g1",
              name: "Uchenna",
              isPrimary: true,
              meal: "Rice",
              dietaryNotes: "Line one\nLine two",
            },
          ],
        },
      ],
      {},
    );
    expect(csv).toContain('"Ada, ""family"""');
    expect(csv).toContain('"Line one\nLine two"');
  });
  it("retains unnamed households and distinguishes unanswered from declined RSVP", () => {
    const csv = guestExportCsv(
      [
        { ...row, guests: [], countAttending: null },
        { ...row, id: "c", guests: [], countAttending: 0 },
      ],
      {},
    );
    expect(csv).toContain('"Pending",""');
    expect(csv).toContain('"No","0"');
    expect(csv.split("\r\n")).toHaveLength(4);
  });
});
