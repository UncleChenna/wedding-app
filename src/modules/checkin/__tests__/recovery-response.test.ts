import { expect, it, vi } from "vitest";
import {
  recoveryImportResponse,
  recoveryReceiptResponse,
  readRecoveryBody,
  type RecoveryPorts,
} from "../server/recovery-response";
const record = {
  actor: { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) },
  event: {
    clientEventId: "22222222-2222-4222-8222-222222222222",
    invitationId: null,
    passVersion: 1,
    reportedAt: "2026-12-19T12:00:00Z",
    reportedResult: "valid" as const,
    reportedPeople: 1,
  },
};
const input = {
  requestId: "33333333-3333-4333-8333-333333333333",
  reviewed: true,
  evidence: { version: 1, records: [record] },
};
const request = (body: unknown, origin = "https://wedding.test") =>
  new Request("https://wedding.test/api/admin/scans/recovery", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
function ports(): RecoveryPorts {
  return {
    authorize: vi.fn(async () => "44444444-4444-4444-8444-444444444444"),
    key: () => Buffer.alloc(32, 1),
    reconcile: vi.fn(async () => [
      {
        clientEventId: record.event.clientEventId,
        status: "recorded" as const,
        result: "valid" as const,
        admitted: 1,
        conflict: false,
      },
    ]),
  };
}
it("denies missing admin access, cross-origin input, unreviewed files and absent signing configuration before writes", async () => {
  for (const kind of ["auth", "origin", "review", "key"]) {
    const p = ports();
    if (kind === "auth") p.authorize = async () => null;
    if (kind === "key") p.key = () => null;
    const response = await recoveryImportResponse(
      request(
        kind === "review" ? { ...input, reviewed: false } : input,
        kind === "origin" ? "https://other.test" : "https://wedding.test",
      ),
      p,
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(p.reconcile).not.toHaveBeenCalled();
  }
});
it("returns signed exact acknowledgement only after reconciliation and verifies it without staff credentials", async () => {
  const p = ports(),
    response = await recoveryImportResponse(request(input), p);
  const body = await response.json();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  const verified = await recoveryReceiptResponse(request({ receipt: body.receipt }), p.key());
  expect(verified.status).toBe(200);
  const evidence = await verified.json();
  expect(evidence.entries[0].ack.clientEventId).toBe(record.event.clientEventId);
  expect(evidence.entries[0].digest).toMatch(/^[a-f0-9]{64}$/);
});
it("never signs rejected or uncommitted records", async () => {
  const p = ports();
  p.reconcile = async () => [{ clientEventId: record.event.clientEventId, status: "retry" }];
  expect((await (await recoveryImportResponse(request(input), p)).json()).receipt).toBeNull();
});
it("cancels oversized streamed data even when Content-Length lies", async () => {
  const cancel = vi.fn();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(2048));
    },
    cancel,
  });
  const req = new Request("https://wedding.test/api/recovery/receipt", {
    method: "POST",
    headers: {
      Origin: "https://wedding.test",
      "Content-Type": "application/json",
      "Content-Length": "1",
    },
    body,
    duplex: "half",
  } as RequestInit);
  expect(await readRecoveryBody(req, 1024)).toBeNull();
  expect(cancel).toHaveBeenCalled();
});
