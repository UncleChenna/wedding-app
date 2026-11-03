import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ find: vi.fn(), set: vi.fn(), cookies: vi.fn() }));
vi.mock("../server/table-repository", () => ({ findTable: mocks.find }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error("redirect:" + path);
  },
  unstable_rethrow: () => {},
}));
import { selectTableAction } from "../server/table-actions";
import { TABLE_COOKIE } from "../lib/table-selection";
const initial = { status: "idle" as const, value: "" };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookies.mockResolvedValue({ set: mocks.set });
  mocks.find.mockResolvedValue({ id: "id", number: 7 });
  mocks.set.mockImplementation(() => undefined);
});
it("remembers only the canonical number in an HttpOnly session cookie then redirects", async () => {
  const data = new FormData();
  data.set("table", "007");
  await expect(selectTableAction(initial, data)).rejects.toThrow("redirect:/order#selected-table");
  expect(mocks.set).toHaveBeenCalledWith(TABLE_COOKIE, "7", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/order",
  });
  expect(mocks.set.mock.calls[0]?.[2]).not.toHaveProperty("maxAge");
  expect(mocks.set.mock.calls[0]?.[2]).not.toHaveProperty("expires");
});
it("preserves the previous selection when a new number is unknown", async () => {
  mocks.find.mockResolvedValue(null);
  const data = new FormData();
  data.set("table", "8");
  await expect(selectTableAction(initial, data)).rejects.toThrow(
    "redirect:/order?change=1&error=missing&table=8#order-table",
  );
  expect(mocks.cookies).not.toHaveBeenCalled();
  expect(mocks.set).not.toHaveBeenCalled();
});
it("does not persist a malformed or missing number", async () => {
  await expect(selectTableAction(initial, new FormData())).rejects.toThrow(
    "redirect:/order?change=1&error=invalid&table=#order-table",
  );
  expect(mocks.find).not.toHaveBeenCalled();
  expect(mocks.set).not.toHaveBeenCalled();
});
it("returns a friendly failure if the cookie cannot be written", async () => {
  mocks.set.mockImplementation(() => {
    throw new Error("secret internal detail");
  });
  const data = new FormData();
  data.set("table", "7");
  await expect(selectTableAction(initial, data)).rejects.toThrow(
    "redirect:/order?change=1&error=save&table=7#order-table",
  );
});
