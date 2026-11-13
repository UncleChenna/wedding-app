# 0027 — Lightweight guest ordering document

Status: Accepted for TICKET-081 implementation; release QA remains separate.

## Context

The original hydrated Next ordering route transferred about 1.24 MB on a fresh
visit including installation of the service worker. A smaller native offline
document and selective font loading reduced it, but the React/Next runtime,
fonts and worker still exceeded the unchanged 200,000-byte PRD budget.

## Decision

Serve `/order` through a Next Route Handler that returns a themed HTML document.
A content-hashed, self-contained browser bundle enhances the cart. It imports the
existing `submitOrder` retry/idempotency code, response schemas, station grouping,
copy and status polling rules. Database writes, authorization, request budgets,
availability checks and order limits remain in the existing server boundaries.
Response contracts use named `zod/mini` imports with the same strict fields/bounds.

Table selection uses native POST/redirect/GET, including when JavaScript is off.
The handler validates Origin, caps streamed body bytes and revalidates table
numbers before setting the existing HttpOnly, Secure, SameSite session cookie.
Unexpected page-load failures return the shared themed 503 recovery document;
private errors are never serialized. Every order response remains private/no-store.

The HTML and small stylesheet preserve the shared controls' labels, focus,
quantity bounds, sticky action bar, theme tokens and safe-area behavior without
hydrating the entire shared component library. Existing React components remain
available for compatibility; production guest behavior is checked by the existing
table/menu/retry/status browser journeys. Links into this document use native
navigation because Route Handlers do not participate in Next client navigation.

Order-only font subsets preserve the approved faces and their original variable axes.
Latin-1/common punctuation and Igbo glyphs have separate small subsets; other
characters load the original complete face through complementary Unicode ranges.
Generated files retain licenses and source hashes. Real browser canvas comparisons
verify the rendered glyphs, not just family names.

## Consequences

This is a deliberate exception to React shared-component and next/font rendering
for this small document, similar to the standalone scanner/offline boundaries.
Its controls must stay behaviorally aligned with shared components. Shared business
rules remain single-source; only the DOM rendering adapter is separate.

The wire budget counts the actual complete HTTP response stream, including fonts,
worker installation and headers. It uses fresh contexts and does not delay or hide
installation. The public worker response negotiates gzip while retaining identity,
`Vary: Accept-Encoding`, scope and its existing no-store update policy. Large menus or additional Unicode font downloads can increase total
traffic; the evidence states the actual synthetic menu and themes measured. The
launch menu and physical network remain release QA rather than an invented pass.

Rollback restores `/order/page.tsx` and its previous renderer; no database migration
or data conversion is needed. Keep immutable old build assets available for clients
already holding a document. Generation runs before both production build and dev.
