# Ticket

TICKET-174 — Add the admin scan log and dispute filters.

# Summary

Admins can review gate attempts at `/admin/scans`, isolate disputed offline reports,
and add predefined resolution notes without rewriting admission evidence or counts.

# Changes

- Filter by invitation (including unknown attempts), received time, staff, device,
  all five verdicts, transport and conflict status; 25-row pages retain filters.
- Show reported and received timestamps separately, with manual/QR input method
  distinct from online/offline transport and verdict.
- Verify admin access before every read/write and project only necessary fields.
  No PIN, invitation token, contact address or dietary detail is returned.
- Store predefined notes separately with server-derived authorship, unique request
  identities and database append-only guards. Uncertain retries preserve the exact
  request and resolution across server refreshes until acknowledgement.

# Acceptance criteria and evidence

- PASS: invitation/time/staff/device/all-verdict filters and unknown attempts —
  seven real database tests and the authenticated mobile/desktop scenario.
- PASS: manual input method is separate from verdict/transport; online/offline rows
  and both timestamps — repository fixtures and rendered browser assertions.
- PASS: immutable evidence, bounded safe notes, unauthorized access denied — service
  authorization tests, browser redirect, PostgreSQL RLS/mutation rejection and
  byte-for-byte original-row comparison after adding a note.

# Verification

Verified implementation head `114931ae`, based on develop
`7533201c21af3119e26f7a94b1e2985700584307`.

- Full local unit suite: **1,883 passed / 204 conditional skips**, 235.38 seconds.
  Critical coverage: 98.33% lines, 98.56% branches, 100% functions.
- Normal commit hooks: lint, types and 12 related form/service tests pass.
- Seven scan-log PostgreSQL tests pass locally and in authenticated CI; twelve
  historical admission/seed checks pass locally. Migrations applied twice with
  identical counts, all 25 public tables retain RLS, schema generation has no drift.
- [Authenticated CI](https://github.com/UncleChenna/wedding-app/actions/runs/42732398647)
  admin job passes **six browser cases** (two existing admin, two dashboard, two
  scan-log) plus two dashboard and seven scan-log SQL checks. No retries required.
- Independent source review covered authorization, immutable evidence, request replay,
  controlled retry payloads and filter reset behavior. Final screenshots reviewed.
- Earlier failed runs are retained: sandbox-restricted full tests could not bind
  IPC; first browser run used an ambiguous label locator after clearing filters and
  reused enrolled TOTP accounts on retry. Corrected with a combobox selector and
  separate allowlisted synthetic retry identities; no assertions/timeouts removed.
- Final-head full `pnpm verify` CI remains required before merging.

# Risks and rollout

Additive migrations `0028_scan-resolution-notes.sql` and
`0029_scan-resolution-guards.sql` add an RLS-enabled note table and guards rejecting
UPDATE/DELETE/TRUNCATE. They were generated and tested only in owned disposable
PostgreSQL. No production application occurred. Deploy migrations before code;
rollback app code while retaining the additive table and immutable audit records.
Never roll back by deleting notes. Latest 20 notes per event are displayed; older
notes remain stored. Offline conflict fixtures represent reconciled events; this
PR does not implement or certify the offline queue/sync engine.

# Screenshots

24 final images: `artifacts/TICKET-174/{mobile,desktop}/<theme>-<width>-resolved.png`.
All four themes at 375/768/1280; retained in the **admin-scan-log-evidence** artifact
of the linked CI run. Parent reviewed all mobile-project images; independent review
covers all desktop-project images and the four mobile 375px images.

# UI checklist

Admin scope follows TICKET-217's lighter requirements.

- PASS **Screenshots:** all 24 images inspected; no material clipping or legibility issue.
- PASS **Tokens:** changed components use existing theme variables/shared controls;
  search found no hard-coded colour/font/radius/shadow values.
- PASS **Restraint/typography:** separate filter, attempt and note sections, semantic
  status tokens and existing display/body roles; reviewed all themes.
- PASS **Mobile:** browser checks no horizontal overflow, all visible body controls
  including header/navigation at least 44px; last content clears fixed mobile nav.
- PASS **Motion:** reduced-motion emulation covers screenshots; no new animation.
- PASS **Keyboard:** native labelled inputs/selects, visible shared focus styles,
  Apply filters operated with Enter; no dialogs or custom focus traps introduced.
- PASS **Contrast:** explicit empty axe violation array in every theme and width;
  statuses include text and do not rely only on colour.
- PASS **Load/images:** browser load CLS exactly zero; no images added, existing
  local font setup retained.
- N/A **Performance:** admin-only change; no guest page or QR generation changes.
- PASS **Copy:** concise operational language; expected failures show safe messages.
- PASS **Shared components:** shared Card, Input, Select and Button reused; no new
  reusable design primitive needing a showcase entry.
- N/A **Sharing/devices/QR:** this admin audit screen changes no guest sharing,
  physical scanner, camera, install or QR output behavior; release device gates remain.
- PASS **Feedback:** note saving disables repeated submission and announces success
  or uncertainty; gate sounds/vibration are unaffected.
- PENDING **Verification:** final-head full CI must pass before merge/completion.

# Harness changes, if any

The existing admin journey runs scan-log SQL/browser checks and uploads sanitized
screenshots. Synthetic reset temporarily disables/restores the new named guard in
its existing local-only transaction. Historical admission fixture setup includes
current required import/note tables. No existing gate, hook or assertion is weakened.
