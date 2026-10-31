import { describe, expect, it, vi } from "vitest";
import { readAdminAccess, withAdminAccess, type AdminAccessPort } from "../server/admin-access";

const id = "f8307bae-0c8d-4db0-92fc-956a450ba028";
const factor = {
  id: "750b13b1-8299-414f-b5e8-f80fa9b87037",
  factor_type: "totp",
  status: "verified",
};
function auth(aal: string = "aal1", factors = [factor]): AdminAccessPort {
  return {
    getUser: vi.fn(async () => ({
      data: { user: { id, email: "admin@example.test", factors } },
      error: null,
    })),
    getClaims: vi.fn(async () => ({ data: { claims: { sub: id, aal } }, error: null })),
  };
}
const allowed = ["admin@example.test"];
describe("admin assurance boundary", () => {
  it("requires enrolment for an allowlisted account without a verified factor", async () => {
    expect((await readAdminAccess(auth("aal1", []), allowed)).status).toBe("enroll");
  });
  it("requires a challenge for an AAL1 account with a verified factor", async () => {
    expect((await readAdminAccess(auth(), allowed)).status).toBe("challenge");
  });
  it("admits only verified AAL2 plus a live verified TOTP factor", async () => {
    expect((await readAdminAccess(auth("aal2"), allowed)).status).toBe("ready");
    expect((await readAdminAccess(auth("aal2", []), allowed)).status).toBe("enroll");
  });
  it("fails closed without a live authenticated user", async () => {
    const client = auth("aal2");
    client.getUser = vi.fn(async () => ({ data: { user: null }, error: new Error("expired") }));
    expect((await readAdminAccess(client, allowed)).status).toBe("signed-out");
    expect(client.getClaims).not.toHaveBeenCalled();
  });
  it("rechecks exact membership even for AAL2", async () => {
    expect((await readAdminAccess(auth("aal2"), [])).status).toBe("denied");
  });
  it("rejects invalid signatures and mismatched claim subjects", async () => {
    const client = auth("aal2");
    client.getClaims = vi.fn(async () => ({ data: null, error: new Error("bad signature") }));
    expect((await readAdminAccess(client, allowed)).status).toBe("signed-out");
    client.getClaims = vi.fn(async () => ({
      data: { claims: { sub: "someone-else", aal: "aal2" } },
      error: null,
    }));
    expect((await readAdminAccess(client, allowed)).status).toBe("signed-out");
  });
  it("does not count an unverified or non-TOTP factor", async () => {
    expect(
      (await readAdminAccess(auth("aal2", [{ ...factor, status: "unverified" }]), allowed)).status,
    ).toBe("enroll");
    expect(
      (await readAdminAccess(auth("aal2", [{ ...factor, factor_type: "phone" }]), allowed)).status,
    ).toBe("enroll");
  });
  it("never invokes a privileged operation for AAL1 or an unlisted user", async () => {
    const run = vi.fn(async () => "private data");
    expect((await withAdminAccess(auth(), allowed, run)).ok).toBe(false);
    expect((await withAdminAccess(auth("aal2"), [], run)).ok).toBe(false);
    expect(run).not.toHaveBeenCalled();
    expect(await withAdminAccess(auth("aal2"), allowed, run)).toEqual({
      ok: true,
      value: "private data",
    });
    expect(run).toHaveBeenCalledExactlyOnceWith(id);
  });
});
