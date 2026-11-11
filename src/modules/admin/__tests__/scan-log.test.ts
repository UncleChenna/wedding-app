import { describe, expect, it } from "vitest";
import { parseScanLogFilters, scanNoteInput, scanResolutionNotes } from "../lib/scan-log";

describe("scan log filters", () => {
  it("defaults to a bounded first page and supports unknown invitations", () => {
    expect(parseScanLogFilters({})).toEqual({ ok: true, filters: { page: 1 } });
    expect(
      parseScanLogFilters({ invitation: "unknown", result: "invalid", conflict: "yes" }),
    ).toEqual({
      ok: true,
      filters: { page: 1, invitation: "unknown", result: "invalid", conflict: true },
    });
  });
  it.each(["valid", "already_used", "invalid", "revoked", "not_rsvped"])(
    "accepts verdict %s",
    (result) => {
      expect(parseScanLogFilters({ result }).ok).toBe(true);
    },
  );
  it.each([
    { result: "manual" },
    { page: "0" },
    { page: "1.5" },
    { page: "10001" },
    { result: ["valid", "invalid"] },
    { invitation: "token-secret" },
    { from: "2026-02-30T12:00" },
    { from: "2026-12-20T00:00", to: "2026-12-19T00:00" },
    { device: "x".repeat(257) },
    { staff: "not-a-uuid" },
  ])("rejects malformed or ambiguous filters %j", (input) => {
    expect(parseScanLogFilters(input).ok).toBe(false);
  });
  it("treats blank controls as absent and interprets labelled times as UTC", () => {
    expect(
      parseScanLogFilters({ result: "", from: "2026-12-19T12:30", to: "2026-12-19T14:00" }),
    ).toEqual({
      ok: true,
      filters: { page: 1, from: "2026-12-19T12:30:00.000Z", to: "2026-12-19T14:00:00.000Z" },
    });
  });
});

describe("resolution notes", () => {
  const input = {
    eventId: "00000000-0000-4000-8000-000000000001",
    requestId: "00000000-0000-4000-8000-000000000002",
    resolution: "reviewed",
  };
  it("accepts a predefined note without client actor or arbitrary private text", () => {
    expect(scanNoteInput.safeParse(input).success).toBe(true);
    expect(scanResolutionNotes.reviewed).toContain("Reviewed");
    for (const extra of [{ note: "PIN 123456" }, { actor: "someone-else" }, { dietary: "private" }])
      expect(scanNoteInput.safeParse({ ...input, ...extra }).success).toBe(false);
    expect(scanNoteInput.safeParse({ ...input, resolution: "arbitrary secret" }).success).toBe(
      false,
    );
  });
});
