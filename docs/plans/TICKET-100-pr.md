# Ticket

Ticket: TICKET-100

# Summary

Admins could see the latest RSVP but not how it changed. Guests → Invitation actions → Reply history now opens a protected, read-only timeline for that invitation, with each saved reply or admin correction newest first, explicit UTC timestamps and before/after details. Back to guests returns to the list.

# Changes

- Added `/admin/guests/[id]/history`, its typed route entry and guest-list connection.
- Administrator authorization runs before identifier validation or queries. A read-only repeatable-read transaction selects the household and every audit record, ordered by timestamp descending and ID for deterministic ties.
- Zod projection strips unknown fields, contact details, internal member IDs and raw actor identifiers. No invitation token is selected. Actor labels are Guest/Admin/Recorded update; malformed legacy snapshot details stay visible as unavailable rather than raw JSON.
- Before/after attendance, saved party counts, named guests, meals and dietary needs are readable. Empty, missing-invitation and temporary database-failure states are distinct. No audit record is mutated and no undo is offered.
- Independent review caught menu UUIDs being displayed literally. Recorded IDs now resolve to clearly labelled **current menu names**, since historical labels were not stored. Missing menu items display an honest unavailable message; legacy literal names remain unchanged. Tests cover real UUID-backed snapshots.
- Shared fonts, theme tokens, large links and server-rendered content keep the UI restrained. The shared large retry control already uses the required 18px admin text size.

# Acceptance criteria and evidence

PASS: A real isolated database fixture inserts three audit records deliberately out of chronological order. The authenticated production-browser test follows the actual guest-list action, reloads the page and asserts all three exact record IDs and semantic timestamps in newest-first order. A second invitation proves empty-history isolation; an invalid ID reaches the not-found page.

# Verification

- Initial model test failed before the module existed, then passed after implementation.
- Explicit model/reader/view/route suite: **16 tests passed**. Covers unknown-field stripping, current/missing UUID meals, generic actor labels, invalid snapshots, auth-before-DB, invalid/missing invitation handling, read-only consistency, safe database failure, complete timeline rendering and route inventory.
- `pnpm verify:quick`: lint, strict types and related tests passed; final pre-documentation run selected nine reader/model tests. Earlier implementation run selected 124 passing related tests and one opt-in skip.
- `pnpm db:migrate` / `pnpm db:seed`: passed on only the managed TICKET-100 synthetic database. No migration was added.
- `pnpm build`: passed with the meal-name correction.
- `pnpm exec tsx scripts/test-admin-rsvp-history.ts`: **one test passed in 6.8 seconds**. Real email/TOTP session, anonymous redirect, private no-store response, raw-marker exclusion, actual navigation and return, chronological completeness, readable seeded-menu UUID, empty/not-found states, keyboard activation, reduced motion, four-theme axe scans with zero violations and overflow checks at 375/600/768/1280px.
- The realistic UUID assertion failed against the earlier pre-fix build, then passed after rebuilding the reviewed correction. Assertions/timeouts were retained.
- Base: develop `14d04bb28aea8bbbab1dbd70810b2a30757ec957`. Owned stack `wedding-e0bc90862ece` stopped with backup preserved after browser verification. No collaborator services changed.
- Full verification remains the required CI gate; no local full-suite result is claimed.

# Risks and rollout

No schema, dependency, service, security-policy or CI changes. Normal app deployment adds the read-only route; revert this ticket to remove it. Meals use current menu names because the immutable snapshot stores IDs, not historical labels; the UI makes that distinction explicit. Unavailable legacy snapshot details do not erase their timestamped audit entry. A history with many changes is intentionally complete rather than silently truncated. Physical phone testing and fresh Lighthouse/CLS measurements were not performed; this admin-only change follows the lighter TICKET-217 evidence lane and does not certify outstanding release checks.

# Screenshots

Reviewed synthetic-data screenshots at 375px in ivory: `docs/reviews/TICKET-100/desktop/history.png` and `history-details.png`. Long names wrap inside the viewport; before/after sections stack on phones and use two columns on larger screens. Both screenshots were inspected.

# UI checklist

- PASS Screenshots: required admin 375px evidence inspected.
- PASS Tokens/restraint/typography: existing theme colours and fonts, restrained separators, 18px body text and large links; shared large retry button already meets the admin control minimum. No hard-coded palette or new token.
- PASS Mobile: no overflow at 375/600/768/1280; 44px links, shared admin safe-area navigation preserved.
- PASS Motion/keyboard: no new animation; reduced-motion mode exercised; keyboard Enter follows the history link and return navigation works.
- PASS Contrast: four registered themes, zero axe violations; state is conveyed in text.
- N/A Load/images/performance: no new images or fonts, admin evidence lane; no fresh CLS or Lighthouse claim.
- PASS Copy/shared components: clear read-only UTC copy and honest unavailable states; shared Link styling, RetryButton and admin shell retained.
- N/A Sharing/devices/QR/staff feedback: no guest sharing, QR or scanner-feedback changes; physical devices remain unverified.
- Verification: explicit local results above; exact final-head full CI required before merge.

# Harness changes, if any

Only opt-in ticket-specific browser fixture/runner and journey documentation. No shared hooks or policy changes. Independent review is required before merge.
