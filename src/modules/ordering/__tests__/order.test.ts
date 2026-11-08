import { describe, expect, it, vi } from "vitest";
import { orderFingerprint, orderSubmissionSchema, type OrderResult } from "../lib/order";
import { newRequestId, RETRY_DELAYS_MS, submitOrder } from "../lib/submit-order";
import { orderResponse } from "../server/order-response";

const RICE = "00000000-0000-4000-8000-000000000001";
const WINE = "00000000-0000-4000-8000-000000000002";
const KEY = "00000000-0000-4000-8000-0000000000aa";
const order = {
  clientRequestId: KEY,
  table: 7,
  items: [{ menuItemId: RICE, quantity: 2 }],
  note: "",
};

describe("order submission schema", () => {
  it("stores the note as single-line plain text within 140 characters", () => {
    const parsed = orderSubmissionSchema.parse({
      ...order,
      note: "  No\u0000 onions\n\tplease ​<b>thanks</b> ",
    });
    expect(parsed.note).toBe("No onions please <b>thanks</b>");
    expect(orderSubmissionSchema.safeParse({ ...order, note: "x".repeat(140) }).success).toBe(true);
    expect(orderSubmissionSchema.safeParse({ ...order, note: "x".repeat(141) }).success).toBe(
      false,
    );
  });
  it.each([
    ["empty cart", { ...order, items: [] }],
    ["zero quantity", { ...order, items: [{ menuItemId: RICE, quantity: 0 }] }],
    ["fractional quantity", { ...order, items: [{ menuItemId: RICE, quantity: 1.5 }] }],
    [
      "duplicate item",
      {
        ...order,
        items: [
          { menuItemId: RICE, quantity: 1 },
          { menuItemId: RICE, quantity: 1 },
        ],
      },
    ],
    ["bad table", { ...order, table: 0 }],
    ["bad key", { ...order, clientRequestId: "abc" }],
    ["extra field", { ...order, station: "bar" }],
  ])("rejects %s", (_name, value) => {
    expect(orderSubmissionSchema.safeParse(value).success).toBe(false);
  });
  it("fingerprints independently of item order", () => {
    const a = orderFingerprint({
      tableNumber: 7,
      note: "",
      items: [
        { menuItemId: RICE, quantity: 1 },
        { menuItemId: WINE, quantity: 2 },
      ],
    });
    const b = orderFingerprint({
      tableNumber: 7,
      note: "",
      items: [
        { menuItemId: WINE, quantity: 2 },
        { menuItemId: RICE, quantity: 1 },
      ],
    });
    expect(a).toBe(b);
    expect(orderFingerprint({ tableNumber: 8, note: "", items: [] })).not.toBe(a);
  });
  it("makes v4 request ids with or without randomUUID", () => {
    expect(newRequestId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) });
    try {
      expect(newRequestId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

/** An idempotent fake server: it commits, then the network can still lose its answer. */
function fakeServer(lose: number) {
  const stored = new Map<string, { id: string; body: string }>();
  let calls = 0;
  const fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
    calls++;
    const body = String(init?.body);
    const { clientRequestId } = JSON.parse(body) as { clientRequestId: string };
    const existing = stored.get(clientRequestId);
    const result: OrderResult = existing
      ? existing.body === body
        ? { status: "replayed", orderId: existing.id }
        : { status: "rejected", reason: "mismatch" }
      : {
          status: "created",
          orderId: "00000000-0000-4000-8000-0000000000" + String(calls).padStart(2, "0"),
        };
    if (!existing && result.status === "created")
      stored.set(clientRequestId, { id: result.orderId, body });
    if (calls <= lose) throw new TypeError("connection lost after commit");
    return Response.json(result, { status: result.status === "created" ? 201 : 200 });
  });
  return { fetch: fetch as unknown as typeof globalThis.fetch, stored, calls: () => calls };
}

describe("submitOrder", () => {
  it("retried three times creates one order and reports it sent", async () => {
    const server = fakeServer(3);
    const sleep = vi.fn(async (_ms: number) => {});
    const attempts: number[] = [];
    const outcome = await submitOrder(orderSubmissionSchema.parse(order), {
      fetch: server.fetch,
      sleep,
      onAttempt: (attempt) => attempts.push(attempt),
    });
    expect(server.calls()).toBe(4);
    expect(server.stored.size).toBe(1);
    expect(outcome).toEqual({ status: "sent", orderId: [...server.stored.values()][0]?.id });
    expect(attempts).toEqual([1, 2, 3, 4]);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([...RETRY_DELAYS_MS]);
  });
  it("retries 5xx and unreadable responses, then gives up as failed", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("<html>", { status: 200 }))
      .mockRejectedValue(new TypeError("offline"));
    const outcome = await submitOrder(orderSubmissionSchema.parse(order), {
      fetch,
      sleep: async () => {},
    });
    expect(outcome).toEqual({ status: "failed" });
    expect(fetch).toHaveBeenCalledTimes(RETRY_DELAYS_MS.length + 1);
  });
  it("does not retry a rejection", async () => {
    const fetch = vi.fn(async () =>
      Response.json({ status: "rejected", reason: "sold-out", itemIds: [RICE] }, { status: 422 }),
    );
    const outcome = await submitOrder(orderSubmissionSchema.parse(order), {
      fetch,
      sleep: async () => {},
    });
    expect(outcome).toEqual({
      status: "rejected",
      result: { status: "rejected", reason: "sold-out", itemIds: [RICE] },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("sends every attempt with the same id and body", async () => {
    const server = fakeServer(2);
    await submitOrder(orderSubmissionSchema.parse(order), {
      fetch: server.fetch,
      sleep: async () => {},
    });
    const bodies = vi.mocked(server.fetch).mock.calls.map(([, init]) => init?.body);
    expect(new Set(bodies).size).toBe(1);
  });
});

describe("orderResponse", () => {
  const post = (body: string, type = "application/json") =>
    new Request("http://localhost/api/orders", {
      method: "POST",
      headers: { "content-type": type },
      body,
    });
  it("maps results to status codes with no-store", async () => {
    const cases: [OrderResult, number][] = [
      [{ status: "created", orderId: RICE }, 201],
      [{ status: "replayed", orderId: RICE }, 200],
      [{ status: "rejected", reason: "sold-out", itemIds: [RICE] }, 422],
      [{ status: "rejected", reason: "mismatch" }, 409],
      [{ status: "unavailable" }, 503],
    ];
    for (const [result, status] of cases) {
      const response = await orderResponse(post(JSON.stringify(order)), async () => result);
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual(result);
    }
  });
  it.each([
    ["a form post", post("table=7", "application/x-www-form-urlencoded")],
    ["broken JSON", post("{")],
    ["an invalid order", post(JSON.stringify({ ...order, items: [] }))],
    ["an oversized body", post(JSON.stringify({ ...order, note: "x".repeat(9000) }))],
  ])("rejects %s without touching the database", async (_name, request) => {
    const create = vi.fn();
    const response = await orderResponse(request, create);
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ status: "rejected", reason: "invalid" });
    expect(create).not.toHaveBeenCalled();
  });
  it("hides database errors behind a retryable 503", async () => {
    const response = await orderResponse(post(JSON.stringify(order)), async () => {
      throw new Error("password=secret");
    });
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
});
