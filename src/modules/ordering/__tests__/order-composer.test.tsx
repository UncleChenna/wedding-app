// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OrderComposer } from "../components/order-composer";
import type { MenuItem } from "../lib/menu";
import { orderCopy } from "../lib/order";
import { ORDERS_URL } from "../lib/submit-order";

const RICE = "00000000-0000-4000-8000-000000000001";
const WINE = "00000000-0000-4000-8000-000000000002";
const ORDER_ID = "00000000-0000-4000-8000-0000000000ff";
const items: MenuItem[] = [
  {
    id: RICE,
    name: "Jollof rice",
    description: null,
    category: "meal",
    maxPerOrder: 5,
    station: "kitchen",
    available: true,
    dietaryTags: [],
  },
  {
    id: WINE,
    name: "Red wine",
    description: null,
    category: "alcohol",
    maxPerOrder: 2,
    station: "bar",
    available: true,
    dietaryTags: [],
  },
];

// Availability polling uses the global fetch; order submission uses the injected one.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({ items: items.map(({ id, available }) => ({ id, available })) }),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

function setup(responses: (() => Promise<Response>)[]) {
  const send = vi.fn(async (..._args: Parameters<typeof fetch>) => {
    const next = responses.shift();
    if (!next) throw new Error("no more responses");
    return next();
  });
  let release: () => void = () => {};
  const sleep = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  render(
    <OrderComposer
      items={items}
      table={7}
      pollIntervalMs={60_000}
      deps={{ fetch: send as unknown as typeof fetch, sleep }}
    />,
  );
  return { send, sleep, release: () => release() };
}
const sendButton = () => screen.getByRole("button", { name: /Send order|Try again|Sending…/ });
const choose = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Increase ${name} quantity` }));

it("starts empty and enables sending once something is chosen", () => {
  setup([]);
  expect(screen.getByText(orderCopy.emptyCart)).toBeVisible();
  expect(sendButton()).toBeDisabled();
  choose("Jollof rice");
  choose("Jollof rice");
  expect(screen.getByText("2 items in your order.")).toBeVisible();
  expect(sendButton()).toBeEnabled();
});

it("shows sending, then the sent confirmation with the order and note", async () => {
  let respond: (response: Response) => void = () => {};
  const { send } = setup([() => new Promise<Response>((resolve) => (respond = resolve))]);
  choose("Jollof rice");
  fireEvent.change(screen.getByLabelText(orderCopy.noteLabel), {
    target: { value: "  No pepper please " },
  });
  fireEvent.click(sendButton());
  expect(await screen.findByRole("button", { name: orderCopy.sendingButton })).toBeDisabled();
  expect(screen.getByText(orderCopy.sending)).toBeVisible();
  expect(screen.getByLabelText("Jollof rice quantity")).toBeDisabled();
  expect(screen.getByLabelText(orderCopy.noteLabel)).toHaveAttribute("readonly");
  const [url, init] = send.mock.calls[0] ?? [];
  expect(url).toBe(ORDERS_URL);
  expect(JSON.parse(String(init?.body))).toMatchObject({
    table: 7,
    items: [{ menuItemId: RICE, quantity: 1 }],
    note: "No pepper please",
  });
  await act(async () =>
    respond(Response.json({ status: "created", orderId: ORDER_ID }, { status: 201 })),
  );
  const heading = await screen.findByRole("heading", { name: orderCopy.sent });
  expect(heading).toHaveFocus();
  expect(screen.getByRole("list", { name: "From the kitchen" })).toHaveTextContent(
    "Jollof rice× 1",
  );
  expect(screen.queryByRole("list", { name: "From the bar" })).toBeNull();
  expect(screen.getByText("Your note: No pepper please")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: orderCopy.another }));
  expect(screen.getByText(orderCopy.emptyCart)).toBeVisible();
});

it("says it is still trying, then offers a retry that reuses the same id", async () => {
  const offline = () => Promise.reject(new TypeError("offline"));
  const { send, sleep, release } = setup([
    offline,
    offline,
    offline,
    offline,
    async () => Response.json({ status: "replayed", orderId: ORDER_ID }),
  ]);
  choose("Red wine");
  fireEvent.click(sendButton());
  expect(await screen.findByText(orderCopy.sending)).toBeVisible();
  for (let retry = 0; retry < 3; retry++) {
    await vi.waitFor(() => expect(sleep).toHaveBeenCalledTimes(retry + 1));
    await act(async () => release());
    // Attempts 2 and 3 fail and back off again; attempt 4 is the last one.
    if (retry < 2) expect(await screen.findByText(orderCopy.slow)).toBeVisible();
  }
  expect(await screen.findByText(orderCopy.failed)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: orderCopy.retry }));
  expect(await screen.findByRole("heading", { name: orderCopy.sent })).toBeVisible();
  const ids = send.mock.calls.map(
    ([, init]) => (JSON.parse(String(init?.body)) as { clientRequestId: string }).clientRequestId,
  );
  expect(ids).toHaveLength(5);
  expect(new Set(ids).size).toBe(1);
});

it("uses a new id once the guest changes a failed order", async () => {
  const offline = () => Promise.reject(new TypeError("offline"));
  const { send, sleep, release } = setup([
    offline,
    offline,
    offline,
    offline,
    async () => Response.json({ status: "created", orderId: ORDER_ID }, { status: 201 }),
  ]);
  choose("Red wine");
  fireEvent.click(sendButton());
  for (let retry = 0; retry < 3; retry++) {
    await vi.waitFor(() => expect(sleep).toHaveBeenCalledTimes(retry + 1));
    await act(async () => release());
  }
  expect(await screen.findByText(orderCopy.failed)).toBeVisible();
  choose("Red wine");
  expect(screen.getByText("2 items in your order.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: orderCopy.send }));
  await screen.findByRole("heading", { name: orderCopy.sent });
  const ids = send.mock.calls.map(
    ([, init]) => (JSON.parse(String(init?.body)) as { clientRequestId: string }).clientRequestId,
  );
  expect(new Set(ids).size).toBe(2);
});

it("takes a sold-out item out of the order and explains why", async () => {
  setup([
    async () =>
      Response.json({ status: "rejected", reason: "sold-out", itemIds: [RICE] }, { status: 422 }),
  ]);
  choose("Jollof rice");
  choose("Red wine");
  fireEvent.click(sendButton());
  expect(await screen.findByText(orderCopy.rejected["sold-out"])).toBeVisible();
  expect(screen.getByLabelText("Jollof rice quantity")).toBeDisabled();
  expect(screen.getByLabelText("Jollof rice quantity")).toHaveAccessibleDescription("Sold out");
  expect(screen.getByLabelText("Red wine quantity")).toHaveValue(1);
  expect(screen.getByRole("status")).toHaveTextContent("Jollof rice has just sold out.");
});

it("groups a mixed order's confirmation by kitchen and bar", async () => {
  setup([async () => Response.json({ status: "created", orderId: ORDER_ID }, { status: 201 })]);
  choose("Red wine");
  choose("Jollof rice");
  choose("Jollof rice");
  fireEvent.click(sendButton());
  await screen.findByRole("heading", { name: orderCopy.sent });
  const groups = screen.getAllByRole("heading", { level: 4 }).map((heading) => heading.textContent);
  expect(groups).toEqual(["From the kitchen", "From the bar"]);
  expect(screen.getByRole("list", { name: "From the kitchen" })).toHaveTextContent(
    "Jollof rice× 2",
  );
  expect(screen.getByRole("list", { name: "From the bar" })).toHaveTextContent("Red wine× 1");
});

it("says how long to wait on a cooldown and keeps the order to send again", async () => {
  const { send } = setup([
    async () =>
      Response.json(
        { status: "rejected", reason: "cooldown", retryAfterSeconds: 42 },
        { status: 422 },
      ),
  ]);
  choose("Red wine");
  fireEvent.click(sendButton());
  expect(
    await screen.findByText(
      "Your table's last order went in a moment ago. You can send this one in 42 seconds.",
    ),
  ).toBeVisible();
  expect(send).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Red wine quantity")).toHaveValue(1);
  expect(screen.getByRole("button", { name: orderCopy.send })).toBeEnabled();
});

it("explains the open-order limit", async () => {
  setup([
    async () => Response.json({ status: "rejected", reason: "too-many-open" }, { status: 422 }),
  ]);
  choose("Red wine");
  fireEvent.click(sendButton());
  expect(await screen.findByText(orderCopy.rejected["too-many-open"])).toBeVisible();
});
