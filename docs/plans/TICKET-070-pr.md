# Ticket

Ticket: TICKET-070

# Summary

`/order` previously showed a placeholder. Guests can now enter their table number without signing in, receive a friendly error for an unknown table, and keep or change a valid selection during their browser session. Menu browsing and sending orders remain TICKET-071 and subsequent tickets; the page says the menu is not open yet.

# Changes

- Add Zod validation and a Drizzle lookup returning only the table ID and number. Invalid input never reaches the database; lookup failures return fixed guest-safe copy.
- Save a canonical number in an HttpOnly, SameSite=Lax, production-Secure session cookie scoped to `/order`. Revalidate cookies on every render; do not use them as authorization.
- Add the approved heading, large numeric field, shared button, confirmation and change-table link in all four themes.
- Render complete request-time HTML and use POST/redirect/GET for native error delivery. Both JavaScript and native forms work; error focus selects the visible field rather than hidden action inputs.
- Add focused unit and isolated-database browser tests, screenshots, implementation notes and a per-ticket handoff.

# Acceptance criteria and evidence

- Unknown numbers show a friendly error; known numbers reach confirmation: real production browser coverage, including empty/unknown input and native submission with scripts disabled.
- Table persists across reloads: cookie attributes, reload, table changes, deleted-table handling, tampered values and fresh-context isolation verified.
- No sign-in or invitation token required: all browser tests start anonymously at `/order` using synthetic table rows only.

# Verification

- `pnpm verify:quick`: PASS, lint/types and 16 focused tests.
- `RUN_TABLE_BROWSER_TESTS=1 pnpm exec playwright test e2e/table-selection.spec.ts --project=mobile --workers=1`: PASS, 2 tests in 9.7 seconds.
- `SCREENSHOT_ROUTES=/order pnpm screenshots --workers=2`: PASS, 12 cases. Error and selected-state matrices add 24 screenshots and axe checks.
- `pnpm verify`: PASS, 788 unit tests (41 optional/integration skips), production build, 769 browser checks (165 optional skips). Live table tests were separately enabled and pass.
- Production Lighthouse: three serial runs, Performance 100/100/100, Accessibility 100/100/100, CLS 0/0/0 (`docs/reviews/TICKET-070/performance.json`).
- Verified against develop `be0d656343ad3d31af0f904c3a8763c6f94dc598`.

# Risks and rollout

No migrations, dependencies, lockfiles, RLS or environment changes. Deploy through the normal app pipeline; revert this ticket's implementation to restore the placeholder. Browser session restoration can retain session cookies; this cookie is only a convenience. Order submission must revalidate table/menu state when implemented.

Physical iOS/Android keyboard, safe-area and WhatsApp checks are NOT VERIFIED. The user's existing preview exception allows review while release-blocking TICKET-201 retains them. This PR does not certify guest release readiness.

# Screenshots

[Full review and 36 screenshots](https://github.com/UncleChenna/wedding-app/blob/TICKET-070/docs/reviews/TICKET-070/REVIEW.md): entry/error/selected at 375, 768 and 1280 in Ivory & Gold, Midnight & Champagne, Emerald Night and Blush & Sage.

# UI checklist

See `docs/reviews/TICKET-070/REVIEW.md` for every checklist item and evidence. Browser layout, keyboard, copy, shared controls, tokens, contrast and reduced motion pass. QR and staff feedback are not applicable. Physical device/WhatsApp checks remain explicitly unverified in TICKET-201. Performance, zero-CLS and the full gate pass.

# Harness changes, if any

None. Ticket-specific lessons: target the visible field for error focus; native forms need server-rendered error content, not only serialized action state. No shared harness files changed.
