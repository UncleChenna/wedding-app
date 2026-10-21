/**
 * Security headers applied to every route (see next.config.ts).
 *
 * The CSP uses 'unsafe-inline' for scripts and styles instead of nonces:
 * nonces force every page to render dynamically, which disables static
 * prerendering. See docs/decisions/0006-security-headers.md.
 */

export interface SecurityHeaderOptions {
  isDev: boolean;
  supabaseUrl?: string;
}

export function buildContentSecurityPolicy({ isDev, supabaseUrl }: SecurityHeaderOptions): string {
  const connect = ["'self'"];
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    connect.push(url.origin, `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`);
  }
  if (isDev) connect.push("ws:");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : [])],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "blob:", "data:"],
    "font-src": ["'self'"],
    "connect-src": connect,
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
  };

  return Object.entries(directives)
    .map(([key, values]) => [key, ...values].join(" "))
    .join("; ");
}

export function securityHeaders(options: SecurityHeaderOptions): { key: string; value: string }[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(options),
    },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Camera is needed on the same origin for gate check-in QR scanning.
    {
      key: "Permissions-Policy",
      value: "camera=(self), microphone=(), geolocation=(), payment=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ...(options.isDev
      ? []
      : [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ]),
  ];
}
