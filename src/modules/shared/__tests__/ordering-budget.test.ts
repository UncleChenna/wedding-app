import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimitIdentity } from "../server/rate-limit-identity";
import { checkRequestBudget } from "../server/request-budget-gate";

afterEach(() => vi.useRealTimers());

describe("ordering budget and rotating identity", () => {
  it("rotates daily without using request headers to choose the epoch", () => {
    vi.useFakeTimers();
    const headers = new Headers({ "x-vercel-forwarded-for": "192.0.2.1" });
    vi.setSystemTime(new Date("2026-12-19T00:00:00Z"));
    const first = rateLimitIdentity(headers, "vercel", "synthetic-key");
    vi.setSystemTime(new Date("2026-12-19T23:59:59Z"));
    expect(rateLimitIdentity(headers, "vercel", "synthetic-key")).toBe(first);
    vi.setSystemTime(new Date("2026-12-20T00:00:00Z"));
    expect(rateLimitIdentity(headers, "vercel", "synthetic-key")).not.toBe(first);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("reserves a separate shared-network ordering policy", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    expect(
      await checkRequestBudget(
        { headers: new Headers(), platform: "local", key: "test" },
        "ordering",
        consume,
      ),
    ).toEqual({ status: "allowed" });
    expect(consume).toHaveBeenCalledWith({
      identity: expect.stringMatching(/^[a-f0-9]{64}$/),
      scope: "ordering",
      limit: 240,
      windowSeconds: 60,
    });
  });
});
