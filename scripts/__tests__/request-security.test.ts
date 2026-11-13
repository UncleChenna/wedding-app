import { randomUUID } from "node:crypto";
import { expect, it, vi } from "vitest";
import { admissionResponse } from "../../src/modules/checkin/server/admission-response";
import { scanReadResponse } from "../../src/modules/checkin/server/scan-read-response";
import { scanSyncResponse } from "../../src/modules/checkin/server/scan-sync-response";
import { orderResponse } from "../../src/modules/ordering/server/order-response";
import { moveTicketResponse } from "../../src/modules/ordering/server/move-ticket-response";

const origin = "https://wedding.example";
const gate = { staffId: randomUUID(), deviceId: "device", credentialVersion: 1 };
const board = { station: "kitchen" as const, staffId: randomUUID(), deviceId: "device" };

it("refuses missing or hostile same-site origins before moving a station ticket", async () => {
  const move = vi.fn().mockResolvedValue({
    status: "moved",
    ticketStatus: "served",
    movedAt: "2026-12-19T12:00:00Z",
  });
  for (const suppliedOrigin of [null, "https://hostile.wedding.example"]) {
    const headers = new Headers({ "content-type": "text/plain" });
    if (suppliedOrigin) headers.set("origin", suppliedOrigin);
    const request = new Request(`${origin}/api/kitchen/tickets`, {
      method: "POST",
      headers,
      body: JSON.stringify({ stationOrderId: randomUUID(), from: "received", to: "served" }),
    });
    const response = await moveTicketResponse("kitchen", request, {
      authorize: async () => board,
      move,
    });
    expect(response.status).toBe(403);
  }
  expect(move).not.toHaveBeenCalled();
});

const cases: [
  string,
  number,
  (request: Request, mutation: () => Promise<never>) => Promise<Response>,
][] = [
  ["guest order", 8192, (request, create) => orderResponse(request, create)],
  [
    "station move",
    4096,
    (request, move) =>
      moveTicketResponse("kitchen", request, { authorize: async () => board, move }),
  ],
  [
    "gate admission",
    8192,
    (request, submit) => admissionResponse(request, { authorize: async () => gate, submit }),
  ],
  [
    "gate read",
    8192,
    (request, read) => scanReadResponse(request, { authorize: async () => true, read }),
  ],
  [
    "offline sync",
    128 * 1024,
    (request, reconcile) => scanSyncResponse(request, { authorize: async () => gate, reconcile }),
  ],
];
it.each(cases)(
  "cancels oversized %s bodies before reading the rest or performing I/O",
  async (_name, limit, handle) => {
    const cancel = vi.fn();
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>(
      {
        pull(controller) {
          pulls++;
          if (pulls === 1) controller.enqueue(new Uint8Array(limit + 1).fill(32));
          else if (pulls === 2) controller.enqueue(new TextEncoder().encode("{}"));
          else controller.close();
        },
        cancel,
      },
      { highWaterMark: 0 },
    );
    const init: RequestInit & { duplex: "half" } = {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body,
      duplex: "half",
    };
    const mutation = vi.fn(async (): Promise<never> => {
      throw new Error("Unexpected mutation");
    });
    const response = await handle(new Request(`${origin}/api/test`, init), mutation);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(cancel).toHaveBeenCalledOnce();
    expect(pulls).toBe(1);
    expect(mutation).not.toHaveBeenCalled();
  },
);
