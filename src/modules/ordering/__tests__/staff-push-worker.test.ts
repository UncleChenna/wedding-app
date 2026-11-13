import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
import { staffPushWorkerSource } from "../lib/staff-push-worker";

function worker() {
  const handlers = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(async () => undefined);
  const openWindow = vi.fn(async () => undefined);
  runInNewContext(staffPushWorkerSource, {
    URL,
    self: {
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
      registration: { showNotification },
      location: { origin: "https://wedding.example" },
      clients: { matchAll: async () => [], openWindow },
    },
  });
  return { handlers, showNotification, openWindow };
}

it("receives only station notices and never displays arbitrary payload text", async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.get("push")?.({
    data: {
      json: () => ({
        type: "station-order",
        station: "bar",
        body: "private guest note",
        url: "https://evil.example",
      }),
    },
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  expect(w.showNotification).toHaveBeenCalledWith(
    "New bar orders",
    expect.objectContaining({
      body: "Open the board to see the latest orders.",
      data: { station: "bar" },
    }),
  );
  expect(JSON.stringify(w.showNotification.mock.calls)).not.toContain("private guest note");
});

it("ignores malformed or non-staff push data", () => {
  const w = worker();
  for (const json of [
    () => {
      throw new Error("bad JSON");
    },
    () => ({ type: "station-order", station: "admin" }),
  ]) {
    w.handlers.get("push")?.({ data: { json } });
  }
  expect(w.showNotification).not.toHaveBeenCalled();
});

it("notification clicks open a fixed same-origin station route", async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.get("notificationclick")?.({
    notification: { data: { station: "kitchen", url: "https://evil.example" }, close: vi.fn() },
    waitUntil: (value: Promise<unknown>) => {
      pending = value;
    },
  });
  await pending;
  expect(w.openWindow).toHaveBeenCalledWith("https://wedding.example/kitchen");
});
