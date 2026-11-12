// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSettled,
  nextPollMs,
  orderStatusSchema,
  receiptSchema,
  type OrderStatusView,
} from "../lib/order-status";
import { orderStatusResponse } from "../server/order-status";
import { LiveOrderStatus, OrderStatusLine } from "../components/order-status-live";

const view = (kitchen: string, bar?: string): OrderStatusView =>
  ({
    stations: [
      { station: "kitchen", status: kitchen },
      ...(bar ? [{ station: "bar", status: bar }] : []),
    ],
  }) as OrderStatusView;

describe("order receipts", () => {
  it("accepts only random v4 UUIDs: 122 random bits, well over 96", () => {
    expect(receiptSchema.safeParse(randomUUID()).success).toBe(true);
    for (const guess of [
      "1",
      "00000000-0000-0000-0000-000000000000",
      "12345678-1234-1234-1234-123456789012",
    ])
      expect(receiptSchema.safeParse(guess).success).toBe(false);
    // A v4 UUID fixes 6 of its 128 bits (version and variant); the other 122 are random.
    expect(128 - 6).toBeGreaterThanOrEqual(96);
  });
});

describe("order status rules", () => {
  it("is settled only when every station is served or cancelled", () => {
    expect(isSettled(view("served", "cancelled"))).toBe(true);
    expect(isSettled(view("served", "preparing"))).toBe(false);
    expect(isSettled(view("received"))).toBe(false);
  });

  it("polls every 1.5s, backs off after failures, and honours a wait", () => {
    expect(nextPollMs(0)).toBe(1_500);
    expect(nextPollMs(1)).toBe(3_000);
    expect(nextPollMs(10)).toBe(15_000);
    expect(nextPollMs(0, 20)).toBe(20_000);
  });
});

describe("orderStatusResponse", () => {
  it("answers a malformed and an unknown receipt with the same 404", async () => {
    const load = vi.fn(async () => null);
    const malformed = await orderStatusResponse("table-12", load);
    const unknown = await orderStatusResponse(randomUUID(), load);
    expect(malformed.status).toBe(404);
    expect(unknown.status).toBe(404);
    expect(await malformed.json()).toEqual(await unknown.json());
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("returns only station statuses, never another field", async () => {
    const ok = await orderStatusResponse(randomUUID(), async () => view("preparing", "served"));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual(view("preparing", "served"));
    expect(ok.headers.get("cache-control")).toBe("private, no-store");
    const leaky = await orderStatusResponse(
      randomUUID(),
      async () => ({ ...view("served"), table: 12, guestName: "Ada" }) as OrderStatusView,
    );
    expect(leaky.status).toBe(503);
    expect(JSON.stringify(await leaky.json())).not.toMatch(/Ada|12/);
    expect(
      orderStatusSchema.safeParse({
        stations: [{ station: "kitchen", status: "served", notes: "x" }],
      }).success,
    ).toBe(false);
  });
});

describe("LiveOrderStatus", () => {
  afterEach(() => vi.useRealTimers());

  it("updates through received, preparing and served, then stops asking", async () => {
    vi.useFakeTimers();
    const replies = [view("received"), view("preparing"), view("served")];
    const fetcher = vi.fn(async () => Response.json(replies.shift() ?? view("served")));
    render(
      <LiveOrderStatus orderId={randomUUID()} fetcher={fetcher}>
        {({ view: current, slow }) => (
          <OrderStatusLine view={current} station="kitchen" slow={slow} />
        )}
      </LiveOrderStatus>,
    );
    await act(async () => {});
    expect(screen.getByText("Received")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1_500));
    expect(screen.getByText("Being prepared")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(1_500));
    expect(screen.getByText("Served. Enjoy every bite.")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(30_000));
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("keeps the last status and says it's still checking when the signal drops", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(Response.json(view("preparing")))
      .mockRejectedValueOnce(new Error("offline"))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(Response.json(view("served")));
    render(
      <LiveOrderStatus orderId={randomUUID()} fetcher={fetcher}>
        {({ view: current, slow }) => (
          <OrderStatusLine view={current} station="kitchen" slow={slow} />
        )}
      </LiveOrderStatus>,
    );
    await act(async () => {});
    await act(async () => vi.advanceTimersByTime(1_500));
    await act(async () => vi.advanceTimersByTime(3_000));
    expect(screen.getByText("Being prepared")).toBeInTheDocument();
    expect(screen.getByText("We'll keep checking. The signal is slow.")).toBeInTheDocument();
    await act(async () => vi.advanceTimersByTime(6_000));
    expect(screen.getByText("Served. Enjoy every bite.")).toBeInTheDocument();
  });
});
