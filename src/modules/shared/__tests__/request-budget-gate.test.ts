import { describe, expect, it, vi } from "vitest";
import { checkRequestBudget, requestBudgetResponse } from "../server/request-budget-gate";

const context = {
  headers: new Headers({ "x-vercel-forwarded-for": "192.0.2.1" }),
  platform: "vercel" as const,
  key: "synthetic-test-key",
};

describe("request budget boundary", () => {
  it("expresses long waits in minutes while preserving exact protocol seconds", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 600 });
    const result = await checkRequestBudget(context, "pin", consume);
    expect(result).toMatchObject({
      retryAfterSeconds: 600,
      message: "Please wait 10 minutes before trying again. Thank you for your patience.",
    });
  });
  it("denies untrusted identity before reaching the database", async () => {
    const consume = vi.fn();
    expect(
      await checkRequestBudget({ ...context, headers: new Headers() }, "lookup", consume),
    ).toMatchObject({ status: "unavailable" });
    expect(consume).not.toHaveBeenCalled();
  });

  it("passes only a digest and server-owned policy to the shared store", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    expect(await checkRequestBudget(context, "pin", consume)).toEqual({ status: "allowed" });
    expect(consume).toHaveBeenCalledWith({
      identity: expect.stringMatching(/^[0-9a-f]{64}$/),
      scope: "pin",
      limit: 30,
      windowSeconds: 600,
    });
    expect(JSON.stringify(consume.mock.calls)).not.toContain("192.0.2.1");
  });

  it("preserves cooldown guidance without disclosing the submitted credential", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: false, retryAfterSeconds: 287 });
    const result = await checkRequestBudget(context, "lookup", consume);
    expect(result).toMatchObject({ status: "limited", retryAfterSeconds: 287 });
    if (result.status === "allowed") throw new Error("Expected denial");
    const response = requestBudgetResponse(result);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("287");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(await response.text()).toContain("Please");
  });

  it("fails closed and discards database exception details", async () => {
    const consume = vi.fn().mockRejectedValue(new Error("private query: invitation-token PIN IP"));
    const result = await checkRequestBudget(context, "lookup", consume);
    expect(result).toMatchObject({ status: "unavailable", retryAfterSeconds: 60 });
    expect(JSON.stringify(result)).not.toContain("private query");
    if (result.status === "allowed") throw new Error("Expected denial");
    expect(requestBudgetResponse(result).status).toBe(503);
  });
});

it("isolates lost-link submissions from lookup/PIN budgets", async () => {
  const consume = vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  expect(await checkRequestBudget(context, "lost_link", consume)).toEqual({ status: "allowed" });
  expect(consume).toHaveBeenCalledWith({
    identity: expect.stringMatching(/^[0-9a-f]{64}$/),
    scope: "lost_link",
    limit: 10,
    windowSeconds: 60,
  });
});
