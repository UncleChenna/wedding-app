# Ticket

TICKET-093 — Build the seating plan: tables and assignments.

# Problem and result

Admins could see table details but could not manage seating. The control room and
Guests page now link to `/admin/guests/seating`, where admins can add/edit/delete
empty tables and assign or unassign entire households with keyboard-accessible
forms. Over-capacity assignments warn and remain allowed. The live guest pass
immediately reads the current assignment, including renamed table numbers.

# Changes

- Authenticated page and actions; strict server validation and minimal private projections.
- Confirmed seats use the stored RSVP count; pending seats use named household members,
  not unused tag-along capacity. Declined/revoked invitations consume no seats.
- Invitation and member table IDs update atomically. Stale assignments/table edits
  fail with a refresh message; same-table assignment can repair historical member mismatch.
- Target-table row locks serialize concurrent assignments so combined occupancy warns.
- Deletion refuses occupied tables and any table with order history. Move/unassign
  households first; existing replies, meals, tokens and admission records stay intact.
- Pending submissions keep their dialog open. Delete confirmation and completion
  notices manage focus; no drag-only controls or new mobile navigation row.
- Scanner display remains mandatory in TICKET-060, now explicitly dependent on093;
  no scanner completion is claimed by this PR.

# Acceptance criteria and evidence

- Capacity policy and strict inputs: three unit tests.
- Authorization/action failures and invalidation: six tests, including all non-ready
  sign-in states rejected before writes.
- Four real isolated-database tests: assign/move/renumber/unassign and pass lookup,
  reply/meal preservation, stale writes, order-history/deletion guards, CRUD validation
  and two-connection capacity warnings. All13 focused tests pass after integrating
  develop `886c46cc2d965fac2a6a4d5e4e0f1b0f4c142086` and unchanged0020 migration.
- Two production-browser journeys pass at375/1280px (21.6s): real email/TOTP sign-in,
  anonymous redirect, keyboard assignment, delayed-save Escape/Close protection,
  live signed-pass changes, delete confirmation/cancel/return focus, table deletion.
  -24 axe scans across four themes × two widths × list/assignment/edit states pass.
  -24 screenshots in `docs/reviews/TICKET-093/screenshots/`; no overflow at375/600/768/1280,
  main-page targets at least44px, reduced motion exercised, initial CLS zero.

# Verification

`pnpm build` passes. Initial `pnpm verify:quick` passed lint/types and115 related
unit tests (five opt-in skipped); final quick/full CI results are recorded by the
normal PR workflow. Full CI must pass on the final head before merge.

# Review steps

Sign in with an approved admin and complete TOTP. Open Control room → Seating.
Add tables with capacities1 and4. Assign a two-person household to the first;
confirm warning without rejection. Move it to the second, renumber the table,
and reload its current signed pass. Unassign, then delete an empty table. Attempt
to delete an occupied or previously ordered table and confirm preservation.

# UI checklist

PASS: token-only styling, shared Button/Input/Select/Sheet, restrained serif headings
and readable body text, mobile overflow/44px targets, keyboard/focus/pending states,
reduced motion, all-theme axe/contrast, initial CLS zero, warm actionable copy.
Screenshots are retained for visual review. N/A: new imagery/fonts, QR rendering,
physical sharing/device checks and Lighthouse (admin-only UI; existing guest pass
presentation is unchanged). Actual guest-device release checks remain mandatory in
TICKET-201; this ticket does not certify them.

# Risks and rollout / rollback

No new schema, dependency or RLS policy. Standard application deployment; revert
this ticket to remove management UI while preserving stored assignments. Existing
PDF/offline pass copies remain snapshots; reopen the live pass for current seating.
Capacity warnings are advisory and pending counts are explicitly estimates based on
named guests. Empty-only deletion intentionally preserves household/order history.

# Harness changes

TICKET-060 dependency/acceptance mapping only. No tests, checks or hooks weakened.
