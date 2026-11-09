import { expect, it, vi } from "vitest";
import { retryAfterSeconds, submitOrder } from "../lib/submit-order";

it.each([null, "", "nonsense", "-1", "0"])(
  "uses a safe wait for invalid Retry-After %s",
  (value) => {
    expect(retryAfterSeconds(value, Date.UTC(2026, 11, 19))).toBe(60);
  },
);

it("accepts an HTTP date and bounds excessive waits", () => {
  expect(retryAfterSeconds("Sat, 19 Dec 2026 00:00:20 GMT", Date.UTC(2026, 11, 19))).toBe(20);
  expect(retryAfterSeconds("999999999999")).toBe(86400);
});

it("returns a rate-limit wait without retrying early or changing the request", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response("Please wait", { status: 429, headers: { "Retry-After": "60" } }),
    );
  const sleep = vi.fn();
  const order = {
    clientRequestId: "11111111-1111-4111-8111-111111111111",
    table: 1,
    note: "",
    items: [{ menuItemId: "22222222-2222-4222-8222-222222222222", quantity: 1 }],
  };
  expect(await submitOrder(order, { fetch, sleep })).toEqual({
    status: "limited",
    retryAfterSeconds: 60,
  });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(sleep).not.toHaveBeenCalled();
  expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body ?? "{}")).toEqual(order);
});
