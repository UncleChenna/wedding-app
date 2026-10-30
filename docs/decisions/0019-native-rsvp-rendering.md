# 0019 — Native RSVP rendering and token-safe form requests

Status: Accepted for TICKET-040 implementation; release verification pending.

## Context

RSVP must work without JavaScript. The personal invitation's Suspense loading shell stayed visible in a JavaScript-disabled browser. Once full HTML rendering was enabled, native form POSTs failed Next.js's origin check because no-referrer produced Origin: null.

## Decision

Only /i/[token] uses the installed Next.js 16.4 route config instant=false with request-bound rendering and no page-level streaming placeholder. It intentionally waits for the authorized personal content instead of relying on JavaScript to reveal it. Other routes retain their existing rendering behavior. Personal data remains uncached.

Use Referrer-Policy: strict-origin on invitation responses: the site origin may be sent, but the private path, token and query are stripped. Keep Next.js's own action origin validation unchanged. Browser tests assert the actual Origin and Referer on both hydrated and native form POSTs.

GET/HEAD requests still check published invitations in Proxy. POST requests reach their Server Action, which validates the submitted capability inside the database transaction. Rewriting a revoked POST to the not-found route loses the action module and produces a framework error; authorization belongs in the action regardless of Proxy.

## Consequences

A private invitation's first byte can wait for database reads. Measure guest performance and CLS before release; do not cache guest data to mask latency. A native form remains functional with scripts disabled, including confirmation after reload. Proxy's POST handling is not authorization: every mutation must validate its own token and state.

The latest POST routing cleanup still needs a rebuilt browser run. No CSRF allowlist, framework origin check, RLS policy or test assertion was disabled.

References: installed Next.js docs for connection, instant and forms; [MDN Referrer-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy).
