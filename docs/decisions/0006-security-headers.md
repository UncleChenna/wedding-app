# 0006 — Static CSP with 'unsafe-inline' instead of nonces

- Status: Accepted · 2026-10-21

**Context.** Next.js nonce-based CSP forces every page to render dynamically, which disables static prerendering and Partial Prerendering.

**Decision.** Apply security headers from `next.config.ts`: CSP with `script-src 'self' 'unsafe-inline'` (plus `'unsafe-eval'` in dev only), `frame-ancestors 'none'`, `object-src 'none'`, `connect-src` limited to self + Supabase; HSTS (prod), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` allowing the camera on our origin only (QR scanning).

**Consequences.** Fast static pages. XSS protection relies on React escaping and not using `dangerouslySetInnerHTML` with user content. Revisit with Next's SRI support when it is stable.

## Local capability review — TICKET-241 (2026-11-13)

The policy still permits same-origin service workers, blob decoder workers, local fonts and the same-origin gate camera. Microphone, geolocation and payment remain denied. Supabase connections use only the configured HTTP(S) origin and its corresponding WS(S) origin; localhost ports and IPv6 remain supported for isolated verification. Browser code has no WhatsApp provider requirement. Future browser monitoring integrations must add a reviewed specific origin rather than a wildcard.

A URL parser alone is insufficient for constructing CSP sources: it accepts wildcard and semicolon-containing hostnames. The configuration boundary now validates HTTP(S), an exact hostname and absence of credentials before interpolation. Invalid configuration fails closed with a fixed message that does not echo its value. No existing directive is relaxed.

Production-browser smoke coverage checks delivered headers, fonts, a real blob worker, actual service-worker activation and camera permission policy, then asserts no unexpected CSP violation. A separate negative test requires actual `script-src-elem` violation events for an unauthorized HTTPS script and a data-URL script. It does not claim to block all inline injection: the accepted `unsafe-inline` tradeoff above remains unchanged, and no nonce migration is included.

This is local implementation evidence only. TICKET-124 still requires HTTPS staging verification after TICKET-149, securityheaders.com grade A or better on production with a screenshot, and repeated post-release capability smoke checks. Physical camera operation, live hosted Supabase realtime and an external service's grade cannot be certified by loopback browser tests.
