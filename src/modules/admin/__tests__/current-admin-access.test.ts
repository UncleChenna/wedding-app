import { beforeEach, describe, expect, it, vi } from "vitest";
import { withCurrentAdminAccess } from "../server/current-admin-access";
import { enrollMfaAction } from "../server/mfa-actions";

const mocks = vi.hoisted(() => ({ user: vi.fn(), claims: vi.fn(), enroll: vi.fn() }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/modules/shared/server/env", () => ({
  serverEnv: { ADMIN_EMAIL_ALLOWLIST: "admin@example.test" },
}));
vi.mock("@/modules/shared/server/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getUser: mocks.user,
      getClaims: mocks.claims,
      mfa: { enroll: mocks.enroll },
    },
  }),
}));
const userId = "9b3379b7-f563-4380-a835-262e061b901a";
const factor = {
  id: "028012b4-1c68-43cc-b526-ff3d7e74cf75",
  factor_type: "totp",
  status: "verified",
};
beforeEach(() => {
  mocks.user.mockReset();
  mocks.claims.mockReset();
  mocks.enroll.mockReset();
});

describe("direct admin operation matrix", () => {
  for (const caller of [
    "admin-aal2",
    "admin-aal1",
    "removed-admin",
    "gate",
    "kitchen",
    "bar",
    "guest-capability",
    "anonymous",
    "expired",
  ] as const) {
    it(`checks live authority for ${caller} without relying on proxy or layout`, async () => {
      const hasUser = caller.startsWith("admin-") || caller === "removed-admin";
      mocks.user.mockResolvedValue({
        data: {
          user: hasUser
            ? {
                id: userId,
                email: caller === "removed-admin" ? "removed@example.test" : "admin@example.test",
                factors: [factor],
              }
            : null,
        },
        error: null,
      });
      mocks.claims.mockResolvedValue({
        data: { claims: { sub: userId, aal: caller === "admin-aal1" ? "aal1" : "aal2" } },
        error: null,
      });
      const operation = vi.fn(async () => "private household list");
      const result = await withCurrentAdminAccess(operation);
      expect(result.ok).toBe(caller === "admin-aal2");
      if (caller === "admin-aal2") expect(operation).toHaveBeenCalledExactlyOnceWith(userId);
      else {
        expect(operation).not.toHaveBeenCalled();
        expect(JSON.stringify(result)).not.toContain("household");
      }
    });
  }
  it("rejects direct MFA action invocation without a verified allowlisted user", async () => {
    mocks.user.mockResolvedValue({ data: { user: null }, error: null });
    expect((await enrollMfaAction()).status).toBe("error");
    expect(mocks.enroll).not.toHaveBeenCalled();
  });
});
