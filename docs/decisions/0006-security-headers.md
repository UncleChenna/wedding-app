# 0006 — Static CSP with 'unsafe-inline' instead of nonces

- Status: Accepted · 2026-10-21

**Context.** Next.js nonce-based CSP forces every page to render dynamically, which disables static prerendering and Partial Prerendering.

**Decision.** Apply security headers from `next.config.ts`: CSP with `script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in dev only), `frame-ancestors 'none'`, `object-src 'none'`, `connect-src` limited to self + Supabase; HSTS (prod), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` allowing the camera on our origin only (QR scanning).

**Consequences.** Fast static pages. XSS protection relies on React escaping and not using `dangerouslySetInnerHTML` with user content. Revisit with Next's SRI support when it is stable.
