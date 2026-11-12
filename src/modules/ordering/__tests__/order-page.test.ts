import { beforeEach, expect, it, vi } from "vitest";
const find = vi.hoisted(() => vi.fn());
const cookieRead = vi.hoisted(() => vi.fn());
vi.mock("next/headers", () => ({ cookies: cookieRead }));
vi.mock("../server/table-repository", () => ({ findTable: find }));
vi.mock("../server/menu-repository", () => ({ listMenuItems: vi.fn() }));
vi.mock("@/modules/theming/server/active-themes", () => ({ getStoredActiveThemes: vi.fn() }));
vi.mock("@/modules/shared/server/settings", () => ({ getEventSettings: vi.fn() }));
import { selectOrderTable, orderPage } from "../server/order-page";
const request = (body: string, origin = "http://localhost:3100") =>
  new Request("http://localhost:3100/order", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
beforeEach(() => {
  find.mockReset();
  find.mockResolvedValue({ id: "id", number: 7 });
});
it("keeps the native cookie scoped, HttpOnly and canonical after table validation", async () => {
  const response = await selectOrderTable(request("table=007"));
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("/order#selected-table");
  expect(response.headers.get("set-cookie")).toBe(
    "wedding-table=7; Path=/order; HttpOnly; SameSite=Lax",
  );
});
it("rejects cross-origin posts before accessing the database", async () => {
  expect((await selectOrderTable(request("table=7", "https://elsewhere.test"))).status).toBe(403);
  expect(find).not.toHaveBeenCalled();
});
it("rejects missing origins and excessive bodies", async () => {
  const missing = request("table=7");
  missing.headers.delete("Origin");
  expect((await selectOrderTable(missing)).status).toBe(403);
  expect((await selectOrderTable(request("table=" + "7".repeat(1025)))).status).toBe(413);
  expect(find).not.toHaveBeenCalled();
});
it("preserves the old cookie when the requested table is unknown", async () => {
  find.mockResolvedValue(null);
  const response = await selectOrderTable(request("table=8"));
  expect(response.headers.get("location")).toBe(
    "/order?change=1&error=missing&table=8#order-table",
  );
  expect(response.headers.has("set-cookie")).toBe(false);
});
it("keeps invalid values escaped in the redirect and never uses them as a table id", async () => {
  const response = await selectOrderTable(request("table=%3Cscript%3E"));
  expect(response.headers.get("location")).toContain("error=invalid");
  expect(response.headers.get("location")).not.toContain("<script>");
  expect(find).not.toHaveBeenCalled();
});

it("cancels an oversized streamed form without trusting Content-Length", async () => {
  const cancel = vi.fn();
  const stream = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(800));
    },
    cancel,
  });
  const form = request("");
  Object.defineProperty(form, "body", { value: stream });
  form.headers.set("content-length", "1");
  expect((await selectOrderTable(form)).status).toBe(413);
  expect(cancel).toHaveBeenCalledOnce();
  expect(find).not.toHaveBeenCalled();
});
it("returns a private friendly503 for unexpected native-render failures", async () => {
  cookieRead.mockRejectedValueOnce(new Error("private database secret"));
  const response = await orderPage(new Request("http://localhost:3100/order"));
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toContain("no-store");
  const html = await response.text();
  expect(html).toContain("Please try again shortly");
  expect(html).toContain("try opening the menu again");
  expect(html).not.toContain("private database secret");
});
