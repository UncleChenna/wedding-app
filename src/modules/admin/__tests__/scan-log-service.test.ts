import { describe, expect, it, vi } from "vitest";
import { readScanLog, recordScanNote } from "../server/scan-log-service";
import type { AdminAccess } from "../server/admin-access";

const ready: AdminAccess = { status: "ready", userId: "admin-verified", factors: [] };
const input = {
  eventId: "00000000-0000-4000-8000-000000000001",
  requestId: "00000000-0000-4000-8000-000000000002",
  resolution: "reviewed",
};
function ports(access: AdminAccess = ready) {
  return {
    access: vi.fn().mockResolvedValue(access),
    read: vi.fn().mockResolvedValue({
      entries: [],
      hasMore: false,
      options: { invitations: [], staff: [], devices: [] },
    }),
    append: vi.fn().mockResolvedValue({ status: "saved" }),
    warn: vi.fn(),
  };
}
describe("admin scan log boundary", () => {
  it.each(["signed-out", "denied", "enroll", "challenge"] as const)(
    "denies %s before any private access",
    async (status) => {
      const p = ports({ ...ready, status });
      expect(await readScanLog({}, p)).toEqual({ status: "denied" });
      expect((await recordScanNote(input, p)).ok).toBe(false);
      expect(p.read).not.toHaveBeenCalled();
      expect(p.append).not.toHaveBeenCalled();
    },
  );
  it("validates filters before repository access", async () => {
    const p = ports();
    expect((await readScanLog({ result: "manual" }, p)).status).toBe("invalid");
    expect(p.read).not.toHaveBeenCalled();
  });
  it("passes only validated filters and derives the note author from verified identity", async () => {
    const p = ports();
    expect((await readScanLog({ source: "offline", conflict: "yes" }, p)).status).toBe("ready");
    expect(p.read).toHaveBeenCalledWith({ page: 1, source: "offline", conflict: true });
    expect((await recordScanNote(input, p)).ok).toBe(true);
    expect(p.append).toHaveBeenCalledWith({ ...input, adminId: "admin-verified" });
  });
  it("rejects forged identity and arbitrary note fields", async () => {
    const p = ports();
    expect((await recordScanNote({ ...input, adminId: "forged" }, p)).ok).toBe(false);
    expect(p.append).not.toHaveBeenCalled();
  });
  it("returns a missing event or request conflict without claiming success", async () => {
    const p = ports();
    for (const status of ["not-found", "conflict"]) {
      p.append.mockResolvedValue({ status });
      expect((await recordScanNote(input, p)).ok).toBe(false);
    }
  });
  it("never leaks database errors or private values to messages or logs", async () => {
    const p = ports();
    p.read.mockRejectedValue(new Error("PIN 123456 private-token"));
    p.append.mockRejectedValue(new Error("dietary details private"));
    expect(JSON.stringify(await readScanLog({}, p))).not.toMatch(/123456|private-token/);
    const result = await recordScanNote(input, p);
    expect(result).toMatchObject({ ok: false, uncertain: true });
    expect(JSON.stringify(result)).not.toMatch(/dietary|private/);
    expect(JSON.stringify(p.warn.mock.calls)).not.toMatch(/123456|private|dietary/);
  });
});
