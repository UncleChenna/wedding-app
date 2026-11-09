import { beforeEach, expect, it, vi } from "vitest";

const deps = vi.hoisted(() => ({ budget: vi.fn(), create: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/shared/server/request-rate-limit", () => ({ requestRateLimit: deps.budget }));
vi.mock("@/modules/ordering/server/create-order", () => ({ createOrder: deps.create }));
import { POST } from "@/app/api/orders/route";

beforeEach(() => vi.clearAllMocks());

it.each([
  ["limited", 429],
  ["unavailable", 503],
] as const)("blocks %s before parsing or creating an order", async (status, code) => {
  deps.budget.mockResolvedValue({
    status,
    retryAfterSeconds: 60,
    message: "Please wait a minute.",
  });
  const request = new Request("https://wedding.example/api/orders", {
    method: "POST",
    body: "malformed",
  });
  const read = vi.spyOn(request, "text");
  const response = await POST(request);
  expect(response.status).toBe(code);
  expect(response.headers.get("Retry-After")).toBe("60");
  expect(response.headers.get("Cache-Control")).toContain("no-store");
  expect(await response.text()).toBe("Please wait a minute.");
  expect(deps.budget).toHaveBeenCalledWith(request.headers, "ordering");
  expect(read).not.toHaveBeenCalled();
  expect(deps.create).not.toHaveBeenCalled();
});

it("charges malformed requests too, then preserves existing validation", async () => {
  deps.budget.mockResolvedValue({ status: "allowed" });
  expect(
    (
      await POST(
        new Request("https://wedding.example/api/orders", { method: "POST", body: "broken" }),
      )
    ).status,
  ).toBe(422);
  expect(deps.budget).toHaveBeenCalledTimes(1);
  expect(deps.create).not.toHaveBeenCalled();
});
