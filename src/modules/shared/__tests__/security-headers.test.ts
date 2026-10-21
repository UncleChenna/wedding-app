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
