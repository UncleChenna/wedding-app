import { describe, expect, it, vi } from "vitest";
import { isAdminEmail, parseAdminEmails } from "../lib/admin-emails";
import { requestAdminCode, verifyAdminCode, signOutAdmin } from "../server/auth-service";

const email = "couple@example.test";
function auth() {
  return {
    signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ data: { user: { email } }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };
}
describe("admin allowlist", () => {
  it("normalizes exact addresses and fails closed when unset", () => {
    expect(parseAdminEmails(" Couple@Example.test , planner@example.test ")).toEqual([
      email,
      "planner@example.test",
    ]);
    expect(isAdminEmail(" COUPLE@example.test ", [email])).toBe(true);
    expect(isAdminEmail("couple+other@example.test", [email])).toBe(false);
    expect(isAdminEmail(email, [])).toBe(false);
    expect(() => parseAdminEmails("*@example.test")).toThrow();
  });
});
describe("admin auth boundaries", () => {
  it("refuses unlisted or malformed email before contacting Auth", async () => {
    const client = auth();
    for (const value of ["outsider@example.test", "not-an-email", null])
      expect((await requestAdminCode(value, [email], client)).status).toBe("error");
    expect(client.signInWithOtp).not.toHaveBeenCalled();
  });
  it("requests a code for the normalized allowlisted email", async () => {
    const client = auth();
    expect((await requestAdminCode(" COUPLE@EXAMPLE.TEST ", [email], client)).status).toBe(
      "code-sent",
    );
    expect(client.signInWithOtp).toHaveBeenCalledWith({
      email,
      options: { shouldCreateUser: true },
    });
  });
  it("rejects malformed codes before contacting Auth", async () => {
    const client = auth();
    expect((await verifyAdminCode(email, "123", [email], client)).status).toBe("error");
    expect(client.verifyOtp).not.toHaveBeenCalled();
  });
  it("never exposes provider details or session tokens", async () => {
    const client = auth();
    client.verifyOtp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: "private-detail" },
    });
    const failure = await verifyAdminCode(email, "123456", [email], client);
    expect(failure.status).toBe("error");
    expect(JSON.stringify(failure)).not.toContain("private-detail");
    expect(await verifyAdminCode(email, "123456", [email], client)).toEqual({
      status: "signed-in",
      message: "You’re signed in.",
    });
  });
  it("revokes a mismatched verified identity", async () => {
    const client = auth();
    client.verifyOtp.mockResolvedValueOnce({
      data: { user: { email: "other@example.test" } },
      error: null,
    });
    expect((await verifyAdminCode(email, "123456", [email], client)).status).toBe("error");
    expect(client.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("rechecks allowlist membership at verification", async () => {
    const client = auth();
    expect((await verifyAdminCode(email, "123456", [], client)).status).toBe("error");
    expect(client.verifyOtp).not.toHaveBeenCalled();
  });
  it("reports sign-out failure honestly", async () => {
    const client = auth();
    client.signOut.mockResolvedValueOnce({ error: { message: "network" } });
    expect((await signOutAdmin(client)).status).toBe("error");
    expect((await signOutAdmin(client)).status).toBe("signed-out");
  });
});
