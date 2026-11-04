import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ limit: vi.fn(), lookup: vi.fn() }));
vi.mock("../../src/modules/shared/server/request-rate-limit", () => ({
  requestRateLimit: mocks.limit,
}));
vi.mock("../../src/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("../../src/modules/invitations/server/repository", () => ({
  hasPublishedInvitation: mocks.lookup,
}));
import { config, proxy } from "../../src/proxy";

beforeEach(() => {
  mocks.limit.mockReset().mockResolvedValue({ status: "allowed" });
  mocks.lookup.mockReset().mockResolvedValue(true);
});

describe("private request budget boundary", () => {
  it("renders a themed retry page for documents while keeping download errors small", async () => {
    mocks.limit.mockResolvedValue({
      status: "limited",
      retryAfterSeconds: 12,
      message: "Please wait.",
    });
    const page = await proxy(new NextRequest("http://localhost/i/private-token"));
    expect(page.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    const html = await page.text();
    expect(html).toContain("Please try again shortly");
    expect(html).toContain('<form method="get">');
    expect(html).not.toContain("private-token");
    expect(page.status).toBe(429);
    expect(page.headers.get("Retry-After")).toBe("12");
    const download = await proxy(new NextRequest("http://localhost/i/private-token/pass.png"));
    expect(download.headers.get("x-middleware-rewrite")).toBeNull();
    expect(await download.text()).toBe("Please wait.");
  });
  it.each([
    "/i/unknown",
    "/i/unknown/invitation.pdf",
    "/i/unknown/pass.png",
    "/i/unknown/offline-pass",
    "/p/unknown",
  ])("limits %s before looking up a credential", async (path) => {
    mocks.limit.mockResolvedValue({
      status: "limited",
      retryAfterSeconds: 12,
      message: "Please try again shortly.",
    });
    const response = await proxy(new NextRequest(`http://localhost${path}`));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("12");
    expect(mocks.lookup).not.toHaveBeenCalled();
  });

  it("includes private downloads in the framework matcher", () => {
    expect(config.matcher).toContain("/i/:path*");
    expect(config.matcher).toContain("/p/:path*");
  });

  it("counts HEAD lookups but leaves POST to the action's own gate", async () => {
    await proxy(new NextRequest("http://localhost/i/unknown", { method: "HEAD" }));
    expect(mocks.limit).toHaveBeenCalledTimes(1);
    mocks.limit.mockClear();
    await proxy(new NextRequest("http://localhost/i/unknown", { method: "POST" }));
    expect(mocks.limit).not.toHaveBeenCalled();
  });

  it("does not consume guest lookup budgets for unrelated routes", async () => {
    await proxy(new NextRequest("http://localhost/order"));
    expect(mocks.limit).not.toHaveBeenCalled();
  });
});
