import { describe, expect, it } from "vitest";
import { rateLimitIdentity } from "../server/rate-limit-identity";

const key = "synthetic-test-key-not-a-deployment-secret";
const identity = (value: string) =>
  rateLimitIdentity(new Headers({ "x-vercel-forwarded-for": value }), "vercel", key);

describe("rate-limit network identity", () => {
  it("does not trust forwarded headers outside the configured platform", () => {
    expect(rateLimitIdentity(new Headers({ "x-forwarded-for": "192.0.2.1" }), "local", key)).toBe(
      rateLimitIdentity(new Headers({ "x-vercel-forwarded-for": "192.0.2.9" }), "local", key),
    );
  });

  it("fails closed when the trusted platform header is missing", () => {
    expect(
      rateLimitIdentity(new Headers({ "x-forwarded-for": "192.0.2.1" }), "vercel", key),
    ).toBeNull();
  });

  it.each(["", "192.0.2.1, 192.0.2.2", "192.0.2.1:80", "[2001:db8::1]", "fe80::1%en0", "unknown"])(
    "rejects ambiguous or malformed addresses: %s",
    (value) => expect(identity(value)).toBeNull(),
  );

  it("groups IPv6 privacy addresses in the same /64", () => {
    expect(identity("2001:db8:1:2::1")).toBe(identity("2001:0db8:0001:0002:ffff:abcd:1:2"));
    expect(identity("2001:db8:1:3::1")).not.toBe(identity("2001:db8:1:2::1"));
  });

  it("normalizes IPv4-mapped IPv6 to the IPv4 identity", () => {
    expect(identity("::ffff:192.0.2.1")).toBe(identity("192.0.2.1"));
  });

  it("stores only a keyed digest and ignores device cookies and spoofed alternatives", () => {
    const headers = new Headers({ "x-vercel-forwarded-for": "192.0.2.1", cookie: "device=one" });
    const first = rateLimitIdentity(headers, "vercel", key);
    headers.set("cookie", "device=two");
    headers.set("x-forwarded-for", "198.51.100.2");
    expect(rateLimitIdentity(headers, "vercel", key)).toBe(first);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(rateLimitIdentity(headers, "vercel", `${key}-rotated`)).not.toBe(first);
  });

  it("fails closed with an absent hashing key", () => {
    expect(rateLimitIdentity(new Headers(), "local", "")).toBeNull();
  });
});
