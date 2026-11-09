# Ticket

Ticket: TICKET-069

# Summary

The gate team lacked a printable fallback guest list. Admin → Guests → Print gate list now opens an authorized, timestamped list with every confirmed household and named companion, party size, table and admission boxes. The browser can print it or save an A4 PDF.

# Changes

- Read-only, repeatable-read database snapshot after administrator authorization; selects no invitation links, contact details or notes.
- Pure export model retains every `rsvp_yes` invitation and companion, uses canonical RSVP allowance and admission counters, and sorts by the primary guest’s final name word.
- Missing RSVP allowances are explicitly flagged rather than inferred. Very large parties use bounded write-in totals.
- Scoped screen styles and a named A4 print page hide admin navigation and controls, repeat table headings and keep normal households together. Print uses black ink on white; screen uses theme tokens.
- Independent review found a border-token typo and an overly broad print-page rule; both are fixed. Browser verification exposed empty CSS-module exports under the repository’s existing CSS loader; explicitly namespaced styles fix the actual overflow without changing shared build configuration.

# Acceptance criteria and evidence

- PASS: All confirmed invitations and all companion names are retained. Four model tests, three authorized-reader tests and one semantic-table test cover filtering, sorting, missing data, bounded boxes, denied access and safe failures.
- PASS: Authenticated production-browser export contains all 69 confirmed synthetic invitations. An 11-person long-name fixture remains complete in the PDF.
- PASS: Actual nine-page PDF is A4, black and white, with no clipped columns. macOS PDFKit verifies page dimensions, every stress-fixture name and every character’s bounds; all nine rasterized pages were visually inspected, including repeated headings and the long household.

# Verification

- `pnpm db:migrate` and `pnpm db:seed`: passed against only this managed worktree’s synthetic local database.
- `pnpm build`: passed after the CSS fix.
- `pnpm exec tsx scripts/test-admin-gate-print.ts`: one production-browser test passed. Anonymous access redirects; response is no-store; all companions and confirmed rows appear; four themes have zero axe violations and no horizontal overflow; widths 375/600/768/1280 pass; keyboard Enter invokes printing, Tab reaches Back to guests, reduced-motion mode works, print hides navigation/controls.
- `swift scripts/review-gate-print.swift docs/reviews/TICKET-069/desktop/gate-list.pdf docs/reviews/TICKET-069/desktop/expected-names.json docs/reviews/TICKET-069/desktop/pdf-preview`: passed, nine A4 pages.
- `pnpm verify:quick`: passed lint, types and one related view test. The explicit focused suite passed all eight tests across three files. Full verification runs in required CI; no claim of a local full-suite run.
- Integrated develop `ede359ca` with merge `fa00b3a6` before these checks. Owned database stopped with backup preserved after browser tests; other stacks untouched.

# Risks and rollout

No migrations, dependencies, services or configuration changes. Deploy with the normal application build; revert this ticket to remove the route/link. Current names are free-form, so sorting uses the final word rather than claiming culturally complete surname parsing. The page discloses this. Printed data becomes stale; the page instructs staff to use one working copy and reconcile before returning to scanners. Actual printer handling and distribution remain TICKET-165. Physical device testing and existing release gates remain unverified; this admin-only change does not certify them.

# Screenshots

TICKET-217’s admin evidence lane applies. Reviewed 375px ivory screenshots: `docs/reviews/TICKET-069/desktop/screen.png` and `screen-rows.png`. The narrow table wraps headings and long names; columns stay within the viewport. Nine reviewed A4 raster pages are in `docs/reviews/TICKET-069/desktop/pdf-preview/`, with the actual PDF alongside them. All data is synthetic.

# UI checklist

- PASS Screenshots: both 375px views and all nine actual PDF pages inspected.
- PASS Tokens: screen uses existing tokens; only intentionally monochrome print rules use black/white. Correct border token verified.
- PASS Restraint/typography: one heading, practical gate instructions, semantic table and restrained separators; inherited shared fonts.
- PASS Mobile: four widths and four themes checked; shared large Print button and 44px Back link; fixed navigation remains usable.
- PASS Motion/keyboard: no added animation; reduced-motion, keyboard print and focus progression tested. No new dialog/forms.
- PASS Contrast: axe scans in all four registered themes, zero violations; checkmarks/text convey admission state without colour.
- N/A Load/images/performance: admin evidence lane; no image/font changes or guest-facing performance surface. Fresh CLS/Lighthouse not measured and not claimed.
- PASS Copy/shared components: practical fallback instructions; shared Button/RetryButton, no new general-purpose pattern.
- N/A Sharing/devices/QR: no guest sharing, camera or QR changes; physical devices not tested.
- N/A Staff feedback: read-only admin export, no live scanner feedback changes.
- Verification: quick/focused checks and production browser/PDF evidence above; full required CI must pass before merge.

# Harness changes, if any

Only opt-in ticket-specific browser/PDF review scripts; no shared hooks, policies or CI changes. Independent review is retained before merge.
