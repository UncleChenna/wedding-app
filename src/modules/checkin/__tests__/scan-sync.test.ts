import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  reconcileScan,
  scanSyncBatchSchema,
  type ScanEventAck,
  type ScanEventReport,
} from "../lib/scan-sync";
import { scanSyncResponse } from "../server/scan-sync-response";

const invitation = {
  status: "rsvp_yes" as const,
  tokenVersion: 1,
  attending: true,
  countAttending: 4,
};
const report = (overrides: Partial<ScanEventReport> = {}): ScanEventReport => ({
  clientEventId: randomUUID(),
  invitationId: randomUUID(),
  passVersion: 1,
  reportedAt: "2026-11-21T15:04:05.000Z",
  reportedResult: "valid",
  reportedPeople: 4,
  ...overrides,
});

describe("reconcileScan", () => {
  it("counts a report within the allowance in full", () => {
    expect(reconcileScan(report({ reportedPeople: 2 }), { invitation, admittedSoFar: 2 })).toEqual({
      result: "valid",
      admitted: 2,
      conflict: false,
    });
  });

  it("counts only what remains and flags a second device's party of four", () => {
    expect(reconcileScan(report(), { invitation, admittedSoFar: 0 })).toEqual({
      result: "valid",
      admitted: 4,
      conflict: false,
    });
    expect(reconcileScan(report(), { invitation, admittedSoFar: 4 })).toEqual({
      result: "already_used",
      admitted: 0,
      conflict: true,
    });
    expect(reconcileScan(report(), { invitation, admittedSoFar: 3 })).toEqual({
      result: "valid",
      admitted: 1,
      conflict: true,
    });
  });

  it("flags a valid report the server would have refused and counts nobody", () => {
    const cases = [
      [{ invitation: null, admittedSoFar: 0 }, "invalid"],
      [{ invitation: { ...invitation, status: "revoked" as const }, admittedSoFar: 0 }, "revoked"],
      [{ invitation: { ...invitation, tokenVersion: 2 }, admittedSoFar: 0 }, "revoked"],
      [{ invitation: { ...invitation, status: "sent" as const }, admittedSoFar: 0 }, "not_rsvped"],
    ] as const;
    for (const [state, result] of cases)
      expect(reconcileScan(report(), state)).toEqual({ result, admitted: 0, conflict: true });
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "counts nobody if an internal caller bypasses schema validation with %s people",
    (reportedPeople) => {
      const event = report({ reportedPeople });
      const state = { invitation: { ...invitation }, admittedSoFar: 1 };
      expect(scanSyncBatchSchema.safeParse({ events: [event] }).success).toBe(false);
      expect(reconcileScan(event, state)).toEqual({
        result: "invalid",
        admitted: 0,
        conflict: true,
      });
      // Defensive reconciliation must not rewrite the physical report or canonical state.
      expect(event.reportedPeople).toBe(reportedPeople);
      expect(state).toEqual({ invitation, admittedSoFar: 1 });
    },
  );

  it.each(["already_used", "invalid", "revoked", "not_rsvped"] as const)(
    "preserves a device's %s refusal even when the server now sees an eligible invitation",
    (reportedResult) => {
      const event = report({ reportedResult, reportedPeople: 0 });
      expect(scanSyncBatchSchema.safeParse({ events: [event] }).success).toBe(true);
      expect(reconcileScan(event, { invitation, admittedSoFar: 0 })).toEqual({
        result: reportedResult,
        admitted: 0,
        conflict: false,
      });
    },
  );

  it("counts nobody, and flags it, for a report that skipped the schema", () => {
    // Defence in depth: a fractional count never reaches here through the route.
    expect(
      reconcileScan(report({ reportedPeople: 1.5 }), { invitation, admittedSoFar: 0 }),
    ).toEqual({ result: "invalid", admitted: 0, conflict: true });
  });

  it("keeps a refusal the device showed, without a conflict", () => {
    expect(
      reconcileScan(report({ reportedResult: "revoked", reportedPeople: 0 }), {
        invitation,
        admittedSoFar: 0,
      }),
    ).toEqual({ result: "revoked", admitted: 0, conflict: false });
  });
});

describe("scanSyncBatchSchema", () => {
  it("accepts a well-formed batch", () => {
    expect(scanSyncBatchSchema.safeParse({ events: [report(), report()] }).success).toBe(true);
  });

  it("refuses inconsistent counts, bad ids, empty and oversized batches", () => {
    for (const events of [
      [report({ reportedPeople: 0 })],
      [report({ reportedResult: "invalid", reportedPeople: 2 })],
      [report({ reportedPeople: -1 })],
      [report({ reportedPeople: 1.5 })],
      [{ ...report(), clientEventId: "not-a-uuid" }],
      [{ ...report(), reportedAt: "yesterday" }],
      [],
      Array.from({ length: 201 }, () => report()),
    ])
      expect(scanSyncBatchSchema.safeParse({ events }).success).toBe(false);
  });
});

describe("scanSyncResponse", () => {
  const actor = { staffId: randomUUID(), deviceId: "gate-phone" };
  const post = (body: unknown) =>
    new Request("http://localhost/api/checkin/sync", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("refuses a signed-out or expired device before reading anything", async () => {
    const reconcile = vi.fn();
    const response = await scanSyncResponse(post({ events: [report()] }), {
      authorize: async () => null,
      reconcile,
    });
    expect(response.status).toBe(403);
    expect(reconcile).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("refuses unreadable, duplicated and oversized batches", async () => {
    const reconcile = vi.fn();
    const deps = { authorize: async () => actor, reconcile };
    const twice = report();
    expect((await scanSyncResponse(post("{"), deps)).status).toBe(400);
    expect((await scanSyncResponse(post({ events: [twice, twice] }), deps)).status).toBe(400);
    expect((await scanSyncResponse(post("x".repeat(129 * 1024)), deps)).status).toBe(413);
    expect(reconcile).not.toHaveBeenCalled();
  });

  it("returns one acknowledgement per event", async () => {
    const event = report();
    const acks: ScanEventAck[] = [
      {
        clientEventId: event.clientEventId,
        status: "recorded",
        result: "valid",
        admitted: 4,
        conflict: false,
      },
    ];
    const response = await scanSyncResponse(post({ events: [event] }), {
      authorize: async () => actor,
      reconcile: async (who, events) => {
        expect(who).toEqual(actor);
        expect(events).toEqual([event]);
        return { acks, revoked: false };
      },
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ acks, signedOut: false });
  });

  it("hides storage errors behind a retryable 503", async () => {
    const response = await scanSyncResponse(post({ events: [report()] }), {
      authorize: async () => actor,
      reconcile: async () => {
        throw new Error("connection refused at 10.0.0.1");
      },
    });
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("10.0.0.1");
  });
});
