import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ access: vi.fn(), load: vi.fn() }));
vi.mock("@/modules/admin/server/current-admin-access", () => ({
  currentAdminAccess: mocks.access,
}));
vi.mock("@/modules/invitations/server/printed-card", () => ({ readAdminCard: mocks.load }));
import { GET } from "../../src/app/(admin)/admin/(protected)/invitations/[id]/card.pdf/route";
const id = "85c796e3-8e05-483b-bb1b-6d095fd3d22e";
const run = () =>
  GET(new Request("https://example.com/admin/invitations/" + id + "/card.pdf"), {
    params: Promise.resolve({ id }),
  });
beforeEach(() => {
  mocks.access.mockReset();
  mocks.load.mockReset();
});
it.each(["signed-out", "denied", "enroll", "challenge"])(
  "does not resolve private card data for %s callers",
  async (status) => {
    mocks.access.mockResolvedValue({ status });
    expect((await run()).status).toBe(403);
    expect(mocks.load).not.toHaveBeenCalled();
  },
);
it("lets a verified admin download a draft without publishing or sharing it", async () => {
  mocks.access.mockResolvedValue({ status: "ready" });
  mocks.load.mockResolvedValue({
    cardNumber: 7,
    guestName: "Draft household",
    capacity: 2,
    status: "draft",
    rsvpUrl: "https://example.com/i/" + "a".repeat(43) + "#reply",
  });
  const response = await run();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(mocks.load).toHaveBeenCalledExactlyOnceWith(id);
});
