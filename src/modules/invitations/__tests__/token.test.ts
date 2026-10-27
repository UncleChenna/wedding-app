import { describe, expect, it, vi } from "vitest";

import { generateInvitationToken, invitationTokenSchema } from "../lib/token";
import { allocateInvitationToken } from "../server/allocate-token";

describe("invitation tokens", () => {
  it("creates 10,000 distinct URL-safe tokens containing 32 random bytes", () => {
    const tokens = Array.from({ length: 10_000 }, generateInvitationToken);
    expect(new Set(tokens).size).toBe(10_000);
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(Buffer.from(token, "base64url")).toHaveLength(32);
      expect(invitationTokenSchema.safeParse(token).success).toBe(true);
    }
  });

  it.each(["", "1", "a".repeat(21), "a".repeat(129), "a".repeat(22) + "/", "a".repeat(22) + " "])(
    "rejects malformed or unbounded input %j",
    (token) => {
      expect(invitationTokenSchema.safeParse(token).success).toBe(false);
    },
  );

  it("accepts existing 128-bit URL-safe tokens", () => {
    expect(invitationTokenSchema.safeParse("a".repeat(22)).success).toBe(true);
  });

  it("retries database-confirmed collisions with a new token", async () => {
    const insert = vi
      .fn<(token: string) => Promise<{ id: string } | null>>()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "saved" });
    const result = await allocateInvitationToken(insert);
    expect(result).toEqual({ ok: true, value: { id: "saved" } });
    expect(insert).toHaveBeenCalledTimes(2);
    expect(new Set(insert.mock.calls.map(([token]) => token)).size).toBe(2);
  });

  it("bounds repeated collisions and returns an expected error", async () => {
    const insert = vi.fn().mockResolvedValue(null);
    expect(await allocateInvitationToken(insert)).toEqual({ ok: false, code: "token_exhausted" });
    expect(insert).toHaveBeenCalledTimes(5);
  });

  it("does not hide or retry a database outage as a token collision", async () => {
    const failure = new Error("connection unavailable");
    const insert = vi.fn().mockRejectedValue(failure);
    await expect(allocateInvitationToken(insert)).rejects.toBe(failure);
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
