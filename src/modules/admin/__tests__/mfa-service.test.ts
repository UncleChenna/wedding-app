import { describe, expect, it, vi } from "vitest";
import { enrollAdminTotp, verifyAdminTotp, type AdminMfaPort } from "../server/mfa-service";
import type { AdminFactor } from "../server/admin-access";
const factorId = "750b13b1-8299-414f-b5e8-f80fa9b87037";
const allowed = ["admin@example.test"];
function fixture(factors: AdminFactor[] = []) {
  const user = { id: "admin-id", email: allowed[0], factors };
  const claims = { sub: user.id, aal: "aal1" };
  const client = {
    getUser: vi.fn(async () => ({ data: { user }, error: null })),
    getClaims: vi.fn(async () => ({ data: { claims }, error: null })),
    mfa: {
      enroll: vi.fn(async () => ({
        data: {
          id: factorId,
          totp: {
            secret: "JBSWY3DPEHPK3PXP",
            uri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP&issuer=Test",
          },
        },
        error: null,
      })),
      unenroll: vi.fn(async () => ({ error: null as unknown })),
      challengeAndVerify: vi.fn(async () => ({ error: null as unknown })),
    },
  } satisfies AdminMfaPort;
  return { client, user, claims };
}
const pending = { id: factorId, factor_type: "totp", status: "unverified" };
describe("TOTP bootstrap actions", () => {
  it("enrols only the authenticated allowlisted account and returns safe QR geometry", async () => {
    const { client } = fixture();
    const result = await enrollAdminTotp(client, allowed);
    expect(result.status).toBe("setup");
    if (result.status !== "setup") throw new Error("Expected setup");
    expect(result.setup.qr.side - result.setup.qr.modules).toBe(8);
    expect(result.setup.qr.path).toMatch(/^M/);
    expect(result).not.toHaveProperty("access_token");
    expect(client.mfa.enroll).toHaveBeenCalledOnce();
  });
  it("refuses outsiders before enrolling or removing factors", async () => {
    const { client } = fixture([pending]);
    expect((await enrollAdminTotp(client, [])).status).toBe("error");
    expect(client.mfa.enroll).not.toHaveBeenCalled();
    expect(client.mfa.unenroll).not.toHaveBeenCalled();
  });
  it("cannot replace an existing verified factor using AAL1", async () => {
    const { client } = fixture([{ ...pending, status: "verified" }]);
    expect((await enrollAdminTotp(client, allowed)).status).toBe("error");
    expect(client.mfa.unenroll).not.toHaveBeenCalled();
    expect(client.mfa.enroll).not.toHaveBeenCalled();
  });
  it("restarts only abandoned unverified TOTP setup and stops if cleanup fails", async () => {
    const { client } = fixture([pending]);
    client.mfa.unenroll.mockResolvedValueOnce({ error: new Error("private detail") });
    expect((await enrollAdminTotp(client, allowed)).status).toBe("error");
    expect(client.mfa.enroll).not.toHaveBeenCalled();
    expect((await enrollAdminTotp(client, allowed)).status).toBe("setup");
    expect(client.mfa.unenroll).toHaveBeenCalledWith({ factorId });
  });
  it("rejects malformed codes, foreign factors and revoked membership before challenge", async () => {
    const { client } = fixture([pending]);
    for (const input of [
      { factorId, code: "no" },
      { factorId: "b0544ecb-f28f-443c-ac7a-1c5a36434211", code: "123456" },
    ])
      expect((await verifyAdminTotp(client, allowed, input)).status).toBe("error");
    expect((await verifyAdminTotp(client, [], { factorId, code: "123456" })).status).toBe("error");
    expect(client.mfa.challengeAndVerify).not.toHaveBeenCalled();
  });
  it("does not treat provider success as sufficient without verified AAL2", async () => {
    const { client } = fixture([pending]);
    expect((await verifyAdminTotp(client, allowed, { factorId, code: "123456" })).status).toBe(
      "error",
    );
  });
  it("verifies the current factor then rechecks AAL2", async () => {
    const { client, user, claims } = fixture([{ ...pending }]);
    client.mfa.challengeAndVerify.mockImplementation(async () => {
      user.factors = [{ ...pending, status: "verified" }];
      claims.aal = "aal2";
      return { error: null };
    });
    expect((await verifyAdminTotp(client, allowed, { factorId, code: "123456" })).status).toBe(
      "verified",
    );
  });
  it("returns a friendly failure without leaking provider errors", async () => {
    const { client } = fixture([pending]);
    client.mfa.challengeAndVerify.mockResolvedValue({ error: { message: "private-token" } });
    const result = await verifyAdminTotp(client, allowed, { factorId, code: "123456" });
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("private-token");
  });
});
