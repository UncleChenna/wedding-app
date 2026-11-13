import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, securityHeaders } from "../lib/security-headers";

describe("security headers", () => {
  it("sets the core headers in production", () => {
    const headers = Object.fromEntries(
      securityHeaders({ isDev: false }).map((h) => [h.key, h.value]),
    );
    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
    expect(headers["Permissions-Policy"]).toContain("camera=(self)");
  });

  it("allows Supabase HTTP and websocket origins", () => {
    const csp = buildContentSecurityPolicy({
      isDev: false,
      supabaseUrl: "https://abc.supabase.co",
    });
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("relaxes only what dev tooling needs", () => {
    const csp = buildContentSecurityPolicy({ isDev: true });
    expect(csp).toContain("'unsafe-eval'");
    expect(csp).not.toContain("upgrade-insecure-requests");
  });
});

describe("CSP connection configuration", () => {
  it.each([
    "ftp://example.com",
    "https://*.example.com",
    "https://foo;script-src.example",
    "file:///private/settings",
    "data:text/plain,invalid",
    "https://user:private-password@example.com",
    "not a URL",
  ])("rejects unsafe configuration without exposing its value: %s", (supabaseUrl) => {
    expect(() => buildContentSecurityPolicy({ isDev: false, supabaseUrl })).toThrow(
      /^NEXT_PUBLIC_SUPABASE_URL must be an HTTP\(S\) URL with an exact hostname and no credentials$/,
    );
  });

  it("normalizes a local development origin without losing its port", () => {
    const csp = buildContentSecurityPolicy({
      isDev: false,
      supabaseUrl: "http://127.0.0.1:54321/",
    });
    expect(csp).toContain("connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321;");
    expect(csp).not.toContain(" ws:;");
  });

  it("preserves exact IPv6 loopback origins", () => {
    expect(
      buildContentSecurityPolicy({ isDev: false, supabaseUrl: "http://[::1]:54321" }),
    ).toContain("connect-src 'self' http://[::1]:54321 ws://[::1]:54321;");
  });

  it("retains constrained browser capabilities and production restrictions", () => {
    const csp = buildContentSecurityPolicy({ isDev: false });
    for (const directive of [
      "worker-src 'self' blob:",
      "font-src 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ]) {
      expect(csp).toContain(directive);
    }
    expect(csp).not.toContain("unsafe-eval");
    const headers = Object.fromEntries(
      securityHeaders({ isDev: false }).map(({ key, value }) => [key, value]),
    );
    expect(headers["Permissions-Policy"]).toBe(
      "camera=(self), microphone=(), geolocation=(), payment=()",
    );
  });
});
