import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy, config } from "../../src/proxy";
import { signStaffSession } from "../../src/modules/shared/server/staff-session";
import { createStaffDeviceCookie } from "../../src/modules/shared/server/staff-device-cookie";

const mocks = vi.hoisted(() => ({ claims: vi.fn(), publication: vi.fn() }));
const key = Buffer.alloc(32, 7);
vi.mock("@/modules/shared/server/env", () => ({
  serverEnv: {
    NODE_ENV: "test",
    STAFF_SESSION_SECRET: "07".repeat(32),
    ADMIN_EMAIL_ALLOWLIST: "admin@example.test",
  },
}));
vi.mock("@/modules/shared/lib/env/client", () => ({
  clientEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "synthetic-key",
  },
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims: mocks.claims } }),
}));
vi.mock("@/modules/shared/server/db/client", () => ({ db: {} }));
vi.mock("@/modules/invitations/server/repository", () => ({
  hasPublishedInvitation: mocks.publication,
}));

function request(path: string, method = "GET", cookie = "") {
  return new NextRequest(`http://localhost:3000${path}`, { method, headers: { cookie } });
}
function staffCookie(role: "gate" | "kitchen" | "bar", expired = false) {
  const device = createStaffDeviceCookie(key);
  const now = new Date();
  const token = signStaffSession(
    { staffId: "b887d82d-47f0-437d-9b2a-f812d7e3f4be", role, credentialVersion: 1 },
    device.id,
    new Date(now.getTime() + (expired ? -60_000 : 60_000)),
    key,
    new Date(now.getTime() - 120_000),
  );
  return `wedding-staff-device=${device.cookie}; wedding-staff-session=${token}`;
}
function admin(aal: string, email = "admin@example.test") {
  mocks.claims.mockResolvedValue({
    data: { claims: { sub: "admin-user", email, aal } },
    error: null,
  });
}

beforeEach(() => {
  mocks.claims.mockReset().mockResolvedValue({ data: null, error: new Error("no session") });
  mocks.publication.mockReset().mockResolvedValue(true);
});

describe("request authorization matrix", () => {
  it("covers bar and privileged API routes in the literal matcher", () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        "/bar/:path*",
        "/api/admin/:path*",
        "/api/checkin/:path*",
        "/api/kitchen/:path*",
        "/api/bar/:path*",
      ]),
    );
  });
  it("redirects anonymous admin reads and refuses writes without replaying their POST", async () => {
    for (const path of ["/admin", "/admin/sharing", "/admin/sign-in/private"]) {
      const response = await proxy(request(path));
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/admin/sign-in");
      expect(response.headers.get("cache-control")).toContain("no-store");
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("x-robots-tag")).toContain("noindex");
      expect((await proxy(request(path, "POST"))).status).toBe(403);
    }
  });
  it("requires allowlisted AAL2 claims and does not treat guest or staff identity as admin", async () => {
    admin("aal1");
    const mfa = await proxy(request("/admin"));
    expect(new URL(mfa.headers.get("location") ?? "").pathname).toBe("/admin/mfa");
    expect((await proxy(request("/admin", "POST"))).status).toBe(403);
    admin("aal2", "guest@example.test");
    expect((await proxy(request("/api/admin/settings"))).status).toBe(403);
    admin("aal2");
    expect((await proxy(request("/admin"))).status).toBe(200);
    mocks.claims.mockResolvedValue({ data: null, error: new Error("expired") });
    expect((await proxy(request("/admin", "POST", staffCookie("gate")))).status).toBe(403);
  });
  it("keeps exact auth entry points and guest routes reachable", async () => {
    for (const path of [
      "/admin/sign-in",
      "/admin/sign-out",
      "/admin/mfa",
      "/checkin",
      "/kitchen",
      "/bar",
      "/order",
      "/api/orders",
      "/api/menu/availability",
      "/i/capability",
    ]) {
      expect((await proxy(request(path))).status, path).toBe(200);
      expect((await proxy(request(path, "POST"))).status, path).toBe(200);
    }
    expect(mocks.claims).not.toHaveBeenCalled();
  });
  for (const role of ["gate", "kitchen", "bar"] as const) {
    it(`isolates ${role} sessions from other station routes and actions`, async () => {
      const cookie = staffCookie(role);
      for (const [required, path] of [
        ["gate", "/checkin"],
        ["kitchen", "/kitchen"],
        ["bar", "/bar"],
      ]) {
        const response = await proxy(request(`${path}/private`, "GET", cookie));
        expect(response.status).toBe(role === required ? 200 : 307);
        expect((await proxy(request(`/api${path}/operation`, "POST", cookie))).status).toBe(
          role === required ? 200 : 403,
        );
      }
    });
  }
  it("rejects expired, tampered and unbound staff cookies", async () => {
    for (const cookie of [
      "",
      staffCookie("gate", true),
      staffCookie("gate") + "tampered",
      `wedding-staff-session=${randomBytes(32).toString("hex")}`,
    ]) {
      expect((await proxy(request("/api/checkin/admit", "POST", cookie))).status).toBe(403);
    }
  });
  it("fails closed on provider errors and ignores claimed authorization headers", async () => {
    mocks.claims.mockRejectedValue(new Error("provider down"));
    const incoming = request("/api/admin/settings", "POST");
    incoming.headers.set("x-user-role", "admin");
    incoming.headers.set("x-authenticated", "true");
    const response = await proxy(incoming);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain("provider down");
  });
});
