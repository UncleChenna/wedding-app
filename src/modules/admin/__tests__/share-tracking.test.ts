import { describe, expect, it } from "vitest";
import { planShare, planShareUndo } from "../lib/share-tracking";

const now = new Date("2026-11-09T12:00:00Z");
const first = new Date("2026-11-08T12:00:00Z");
const draft = { status: "draft" as const, sentAt: null, tokenVersion: 1 };

describe("share tracking policy", () => {
  it("publishes the first draft share once", () => {
    expect(planShare(draft, 1, now)).toEqual({ ok: true, status: "sent", sentAt: now });
    expect(planShare({ ...draft, status: "sent", sentAt: first }, 1, now)).toEqual({
      ok: true,
      status: "sent",
      sentAt: first,
    });
  });
  it.each(["rsvp_yes", "rsvp_no"] as const)("preserves %s on repeat sharing", (status) => {
    expect(planShare({ ...draft, status, sentAt: first }, 1, now)).toEqual({
      ok: true,
      status,
      sentAt: first,
    });
  });
  it("rejects revoked and stale links without changing them", () => {
    expect(planShare({ ...draft, status: "revoked" }, 1, now)).toEqual({ ok: false });
    expect(planShare(draft, 2, now)).toEqual({ ok: false });
  });
  it("undoes the first share while preserving a later RSVP", () => {
    expect(planShareUndo({ ...draft, status: "sent", sentAt: now }, draft, true)).toEqual({
      ok: true,
      status: "draft",
      sentAt: null,
    });
    expect(planShareUndo({ ...draft, status: "rsvp_yes", sentAt: now }, draft, true)).toEqual({
      ok: true,
      status: "rsvp_yes",
      sentAt: null,
    });
  });
  it("cannot undo a newer share or lifecycle change", () => {
    expect(planShareUndo(draft, draft, false)).toEqual({ ok: false });
    expect(planShareUndo({ ...draft, tokenVersion: 2 }, draft, true)).toEqual({ ok: false });
    expect(planShareUndo({ ...draft, status: "revoked" }, draft, true)).toEqual({ ok: false });
  });
  it("undoing a repeat share keeps the original timestamp", () => {
    const previous = { ...draft, status: "rsvp_no" as const, sentAt: first };
    expect(planShareUndo(previous, previous, true)).toEqual({
      ok: true,
      status: "rsvp_no",
      sentAt: first,
    });
  });
});
