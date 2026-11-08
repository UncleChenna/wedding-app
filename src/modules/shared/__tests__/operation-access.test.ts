import { beforeEach, describe, expect, it, vi } from "vitest";
import { withStaffAccess } from "../server/guards";
import type { StaffSessionIdentity } from "../server/staff-session";

const mocks = vi.hoisted(() => ({ staff: vi.fn() }));
vi.mock("../server/staff-cookies", () => ({ currentStaff: mocks.staff }));
beforeEach(() => {
  mocks.staff.mockReset();
});

describe("direct staff operation matrix", () => {
  for (const required of ["gate", "kitchen", "bar"] as const) {
    for (const caller of [
      "gate",
      "kitchen",
      "bar",
      "admin",
      "guest-capability",
      "anonymous",
      "expired",
      "revoked",
    ] as const) {
      it(`${required} operation rejects or accepts ${caller} before touching data`, async () => {
        const staff = ["gate", "kitchen", "bar"].includes(caller);
        const identity = staff
          ? {
              staffId: "773b8087-6233-4096-b798-6a249e5cd045",
              role: caller as StaffSessionIdentity["role"],
              credentialVersion: 1,
            }
          : null;
        mocks.staff.mockResolvedValue(identity);
        const operation = vi.fn(async () => ({ private: "station data" }));
        const result = await withStaffAccess(required, operation);
        expect(mocks.staff).toHaveBeenCalledExactlyOnceWith(required);
        expect(result.ok).toBe(caller === required);
        if (caller === required) expect(operation).toHaveBeenCalledExactlyOnceWith(identity);
        else {
          expect(operation).not.toHaveBeenCalled();
          expect(JSON.stringify(result)).not.toContain("station data");
        }
      });
    }
  }
  it("fails closed on live authority failure without serializing its error", async () => {
    mocks.staff.mockRejectedValue(new Error("database credential/private details"));
    const operation = vi.fn();
    const result = await withStaffAccess("gate", operation);
    expect(result.ok).toBe(false);
    expect(operation).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("private details");
  });
  it("does not disguise a permitted operation's failure as an authentication denial", async () => {
    mocks.staff.mockResolvedValue({
      staffId: "773b8087-6233-4096-b798-6a249e5cd045",
      role: "gate",
      credentialVersion: 1,
    });
    const error = new Error("operation failed");
    await expect(
      withStaffAccess("gate", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
  });
});
