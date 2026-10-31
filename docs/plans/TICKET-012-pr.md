# Ticket

TICKET-012

# Summary

Live pages now resolve a validated light/dark theme pair from event settings and render both palettes in the initial server HTML. Devices retain their light/dark preference without a client-side colour flash. Missing, invalid or unavailable settings fall back to Ivory & Gold and Midnight & Champagne with a sanitized warning.

# Changes

- Add the approved, generated active_dark_theme_id migration; retain active_theme_id as the light slot and preserve other event settings.
- Add atomic pair persistence and an internal activation service that validates registry/scheme choices before writing, then immediately expires the cache tag. Future admin actions must authorize callers; this PR exposes no activation endpoint.
- Cache server theme reads, bound the wait to two seconds, and share the selection across root CSS, guest texture and browser-bar metadata.
- Seed both defaults deterministically.
- Preserve private no-store response headers for admin, check-in, kitchen and ordering. The full gate caught browser caching of private placeholders after root caching; the original privacy assertions now pass with added header coverage.

# Acceptance criteria and evidence

- Persistence and validation: seven real isolated database tests, service/cache tests, and two migration runs with identical counts; all twelve public tables retain RLS.
- Server rendering: actual database changes reached initial HTML, computed CSS and browser metadata in four themes × three widths with JavaScript disabled. All four themes pass axe.
- Outage: the full gate ran with the isolated database stopped; pages rendered defaults and logged sanitized warnings. A unit test covers stalled reads and timer cleanup.
- Activation invalidation is tested at the service boundary; no authenticated admin editor is implemented here. Direct SQL bypasses invalidation and uses the documented revalidation schedule.

# Verification

Before integrating develop c22d9d94105817f10c63b7dae239fd2d4f6686e6: full gate passed 442 unit tests (17 opt-in skips), 451 browser tests (123 conditional skips), formatting, lint, strict types and production build. The isolated stored-theme matrix passed; two seed runs produced identical counts. Final integrated t:pr gate passed:458 unit tests (17 opt-in skips),483 browser tests (129 conditional skips), formatting, lint, strict types and production build.

Home Lighthouse mobile: Performance 100/99/100, Accessibility 100/100/100. CLS was 0.00007339025, not zero; Lighthouse identifies the existing celebration-label web-font swap. Physical WhatsApp checks and strict-zero CLS remain TICKET-201 under the user's existing preview-only QA exception. No production release approval is claimed.

# Risks and rollout

Apply the additive migration before deploying this application code; it was tested only on this ticket's isolated local database. No hosted database was changed. Rollback can restore the previous application while retaining the harmless added column; do not drop data.

The default cache is process-local. Multi-instance deployment needs coordinated invalidation; direct SQL revalidates after 30 seconds and expires after five minutes. An already-open page requires refresh. Cached valid selections may remain until refresh during an outage. Custom database-authored themes and the admin editor remain TICKET-181/098.

# Screenshots

[Twelve stored-theme captures and contact sheet](https://github.com/UncleChenna/wedding-app/tree/TICKET-012/docs/reviews/TICKET-012). Each registered theme at 375, 768 and 1280px; all inspected. Existing component markup and theme tokens are unchanged.

# UI checklist

[Item-by-item results](https://github.com/UncleChenna/wedding-app/blob/TICKET-012/docs/reviews/TICKET-012/README.md), including the disclosed nonzero CLS and unverified physical-device checks. This implementation is eligible only under the existing preview QA exception; guest launch still needs TICKET-201.

# Harness changes, if any

No hooks, test assertions or policies were weakened. TICKET-207 records the recurring cold font-build resolver failure; only its definition is included here. Added opt-in isolated theme integration coverage and private HTTP cache regression coverage.

## 31 October integration and regression follow-up

Integrated verified develop7191d981231d9fb71f101d308abc05fa4ec79501 (saved RSVP). Full local gate:467 unit tests/22 opt-in skips and483 browser tests/129 conditional skips; five real RSVP DB tests pass. The prior final CI failed a tiny admin font-swap CLS assertion; it was not reproduced on macOS or the matching Linux browser, and no production typography change is claimed as a fix. The zero-CLS test now measures normal and delayed font loads, waits for final paint, preserves focus checking and includes source-node diagnostics. Four targeted tests pass; final complete gate/CI must pass before merge. Physical-device and inherited preview CLS release work remain201.
