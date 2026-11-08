# TICKET-098 UI review — 2026-11-08

Route: `/admin/themes` (requires approved admin OTP and TOTP). Base: develop
`2706b96ddd0c7fa12c2e499f302d7e21e3108fde`. Four registered palettes; invitation
and table-order previews at 375, 768 and 1280px. Screenshots are under `screenshots/`.
The authenticated test runner is `pnpm exec tsx scripts/test-theme-editor.ts`;
the generic anonymous screenshot runner cannot capture this protected editor.

| Check                | Result and evidence                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS: all 24 reviewed; desktop embedded invitation defect corrected to one column, replacement invitation captures inspected at all widths.                                                                                                       |
| Tokens               | PASS: editor uses semantic theme classes; colour values come from validated tokens, fonts from the curated registry. No new token schema.                                                                                                         |
| Restraint/typography | PASS: one primary publication action, secondary Save, progressive colour controls, existing display/body roles.                                                                                                                                   |
| Mobile               | Automated overflow checks pass at 375/768/1280; physical keyboard and safe-area checks not verified. Shared controls retain 44px minimum heights.                                                                                                 |
| Motion               | PASS: reduced-motion capture completes; editor disables descendant transitions under reduced motion. No new animated reveal.                                                                                                                      |
| Keyboard             | PASS for tested font selection/focus traversal and native controls; physical-device keyboard not verified. No new dialog.                                                                                                                         |
| Contrast             | PASS: Axe asserts zero violations in 24 rendered states; invalid contrast save reports the named pair and creates no draft. Draft styles are scoped away from controls.                                                                           |
| Load/images          | Existing next/image photo retains reserved aspect ratio and blur placeholder; local font system reused. Fresh exact-zero CLS measurements not verified.                                                                                           |
| Performance          | Fresh Lighthouse measurements not verified. Guest rendering defaults are preserved; the changed preview components also have public preview consumers, so no new performance claim is made.                                                       |
| Copy                 | PASS: human editor feedback and approved sample invitation wording; sample venue clearly marked.                                                                                                                                                  |
| Shared components    | PASS: Button/Input/Select and existing invitation/order preview components reused. No new generic UI primitive.                                                                                                                                   |
| Sharing/devices      | No sharing metadata changed. Physical iOS/Android browser checks not verified.                                                                                                                                                                    |
| QR                   | N/A: no QR output changed.                                                                                                                                                                                                                        |
| Staff feedback       | N/A: no staff scanner or station feedback changed.                                                                                                                                                                                                |
| Verification         | PASS: full gate before final embedded-only correction (1091 unit passed/107 skipped;851 smoke passed/195 skipped). Final quick/build and authenticated journey passed after correction (17.2s), including the layout regression and24 Axe checks. |

## Independent review corrections

The review found stale-draft publication, embedded development links and lost
keyboard focus after embedded ordering steps. All three are corrected. Publication
now compares the exact reviewed pair against locked stored rows before writing;
JSON normalization handles omitted optional fields without false conflicts.

The authenticated browser journey passed in 27.8 seconds, including two-tab draft
conflict rejection, unchanged publication on rejection, reviewed activation after
reload, no embedded development links, initial keyboard focus preservation and
step-heading focus. All 24 Axe/overflow combinations passed and screenshots were
refreshed. Replacement Ivory desktop invitation and Emerald mobile order captures
were inspected; earlier full visual review remains recorded above.

Six isolated database publication tests passed, including stale snapshots and
preservation of the live selection. Quick verification passed. A separate review
of the corrections found no remaining blockers. The latest broad local gate
passed lint/types/build and 1,095 unit tests (108 skipped), but its smoke stage
finished with 837 passes, 195 skips and 14 desktop failures during database
unavailability (confirmed HTTP 503 on `/p/invalid`). All 14 failed checks passed unchanged in a serial rerun (21.0s) after
the database recovered. The initial broad command remains recorded as failed;
the review CLI will rerun the full gate.

Disposition: the user's standing authorization permits proceeding through review
while preserving TICKET-201's release gates. Physical-device checks, fresh
Lighthouse and exact-zero CLS remain unverified; none is represented as a pass.

## Current develop integration

Integrated `407fb68db4dde004cf0868274a744ebd435dbbb2` without conflicts. The seven
inherited migration artifacts (0016–0018, their snapshots and journal) match
fetched develop exactly. Applied only to TICKET-098's isolated database: both
migration runs succeeded, post-run row counts match exactly, and all 20 public
tables have RLS enabled. No reset or new migration was introduced. The final
review gate runs against this integrated base; earlier outage evidence is retained.

## Final review gate — 2026-11-08

The forced PR workflow passed on integrated develop
`407fb68db4dde004cf0868274a744ebd435dbbb2`: lint/types/format/tickets/build,
1,106 unit passes (118 opt-in skips), and 851 mobile/desktop smoke passes
(195 opt-in skips; 8.7 minutes). TICKET-098 is in review on PR #110.
Source integration commit: `1337e46e`; status transition: `3d9c7aa6`.
Six publication database tests and the authenticated editor journey also pass.
No production source changed after the separate review beyond the clean,
reviewed develop integration. Final log: `/tmp/TICKET-098-final-pr.log`.

Earlier outage failures and their unchanged recovery are retained below as history.
No test, timeout or runtime protection was weakened. Physical devices, fresh
Lighthouse and theme-studio exact-zero CLS remain unverified in TICKET-201.
The owner authorized proceeding through review with these release gates retained.

Resource lesson: both broad-run interruptions coincided with unhealthy local
Supabase databases; keeping the other idle owned stack stopped allowed the full
unchanged gate to pass. Schedule database-heavy verification and preserve backups
when releasing idle owned stacks. TICKET-218 and TICKET-213 already address stack
pressure; do not create a duplicate resource ticket or stop collaborator stacks.
