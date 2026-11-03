// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MENU_AVAILABILITY_URL, MenuSections } from "../components/menu-sections";
import type { MenuItem } from "../lib/menu";

const RICE = "00000000-0000-4000-8000-000000000001";
const WINE = "00000000-0000-4000-8000-000000000002";
const items: MenuItem[] = [
  {
    id: RICE,
    name: "Jollof rice",
    description: "Tomato rice with warm spices.",
    category: "meal",
    maxPerOrder: 5,
    available: true,
    dietaryTags: ["vegetarian"],
  },
  {
    id: WINE,
    name: "Red wine",
    description: null,
    category: "alcohol",
    maxPerOrder: 2,
    available: false,
    dietaryTags: [],
  },
];
let availability: { id: string; available: boolean }[];
const fetchMock = vi.fn(async () => Response.json({ items: availability }));

beforeEach(() => {
  vi.useFakeTimers();
  fetchMock.mockClear();
  availability = items.map(({ id, available }) => ({ id, available }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function tick(ms = 3000) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

it("groups the menu by category with sold-out items visible, disabled and labelled in text", () => {
  render(<MenuSections items={items} />);
  expect(screen.getByRole("heading", { name: "Meals" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Alcoholic drinks" })).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Soft drinks" })).toBeNull();
  expect(screen.getByText("vegetarian")).toBeVisible();
  const wine = screen.getByLabelText("Red wine quantity");
  expect(wine).toBeDisabled();
  expect(wine).toHaveAccessibleDescription("Sold out");
  expect(screen.getByRole("button", { name: "Increase Red wine quantity" })).toBeDisabled();
  expect(screen.getByLabelText("Jollof rice quantity")).toBeEnabled();
});

it("disables and clears an item that sells out while the page is open, and announces it", async () => {
  render(<MenuSections items={items} />);
  fireEvent.click(screen.getByRole("button", { name: "Increase Jollof rice quantity" }));
  expect(screen.getByLabelText("Jollof rice quantity")).toHaveValue(1);
  availability = [
    { id: RICE, available: false },
    { id: WINE, available: true },
  ];
  await tick();
  expect(fetchMock).toHaveBeenCalledWith(MENU_AVAILABILITY_URL, { cache: "no-store" });
  const rice = screen.getByLabelText("Jollof rice quantity");
  expect(rice).toBeDisabled();
  expect(rice).toHaveValue(0);
  expect(rice).toHaveAccessibleDescription("Sold out");
  expect(screen.getByLabelText("Red wine quantity")).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Jollof rice has just sold out. Red wine is available again.",
  );
  availability = [
    { id: RICE, available: true },
    { id: WINE, available: true },
  ];
  await tick();
  // The cleared choice does not come back on restock.
  expect(screen.getByLabelText("Jollof rice quantity")).toHaveValue(0);
});

it("keeps the last known state when a poll fails or returns an unexpected shape", async () => {
  render(<MenuSections items={items} />);
  fetchMock.mockImplementationOnce(async () => new Response("down", { status: 503 }));
  await tick();
  fetchMock.mockImplementationOnce(async () => Response.json({ items: [{ id: RICE }] }));
  await tick();
  fetchMock.mockImplementationOnce(async () => {
    throw new TypeError("offline");
  });
  await tick();
  expect(screen.getByLabelText("Jollof rice quantity")).toBeEnabled();
  expect(screen.getByLabelText("Red wine quantity")).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("");
});

it("pauses polling while hidden and checks immediately on return", async () => {
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  render(<MenuSections items={items} />);
  await tick(9000);
  expect(fetchMock).not.toHaveBeenCalled();
  visibility.mockReturnValue("visible");
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
