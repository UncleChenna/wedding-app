---
id: TICKET-043
title: Revoke and reissue invitations so old links and QRs stop working
epic: invitations
status: done
priority: urgent
estimate: M
labels: [backend, security]
module: invitations
owner: divine
agent: codex
blocked_by: [TICKET-036, TICKET-056, TICKET-032, TICKET-088]
blocks: [TICKET-065, TICKET-089, TICKET-176]
branch: TICKET-043
pr: https://github.com/UncleChenna/wedding-app/pull/99
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-043: Revoke and reissue invitations so old links and QRs stop working

## Context

INV-7: the admin can revoke or reissue an IV and the old QR stops working on connected devices immediately, and on disconnected devices after refresh within the TICKET-169 policy, including on offline scanners.

See: [Invitations and RSVP](../docs/prd.md#invitations-and-rsvp) (INV-7) · [Security](../docs/prd.md#security).

## Scope

- Revoke sets status revoked; reissue rotates the token and bumps token_version.
- Revocation list exposed to scanners for offline checks.
- Admin buttons with confirmation.

## Out of scope

- Scanner download of the list (TICKET-065).

## Acceptance criteria

- [x] After reissue the old /i/ link shows the neutral page and the new link works.
- [x] An old signed QR verifies cryptographically but is rejected as "Replaced pass" because its version is stale, matching the approved ADR 0020 / TICKET-169 wording (unit).
- [x] Every revoke/reissue is logged with actor and time.

- [x] Online validation rejects old links and pass versions immediately. Offline scanners follow TICKET-169 snapshot freshness; UI must not promise immediate disconnected revocation.

## Test plan

- Unit: Version check logic.
- End-to-end: Admin reissues; old link fails.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Test the revocation/snapshot contract before and after refresh here. The real offline-scanner end-to-end test remains mandatory in TICKET-065 (which depends on this ticket): revoke/reissue while offline, stale warning/policy, and rejection after refresh. Scanner download/UI remains outside TICKET-043 scope.

## Files likely touched

- `src/modules/invitations/server/`
- `src/modules/checkin/lib/`

## Notes / decisions

2026-11-09: Integrated develop 37e9202c and regenerated audit migration 0019, preserving current history. Synthetic-only reset, repeated migration/seed counts and all 21 RLS checks pass. Four lifecycle DB tests, five current admission tests and ten isolated admission migration tests pass. Independent review found successful-revoke focus loss; red browser regression reproduced it, scoped fix passed authenticated mobile/desktop 2/2. Full verification passes 1,157 unit tests / 121 skipped and 863 browser tests / 189 skipped. Physical-device release gates remain explicit under owner preview authorization; offline scanner E2E stays in TICKET-065. See PR #99 and updated review/handoff evidence.

2026-11-04: Partial implementation and 13 focused preview browser checks pass; quick verification passes 64 related tests (53 skipped). Draft PR #99 remains incomplete pending generated audit migration, isolated database integration and full verification. See docs/handoffs/TICKET-043.md.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)
- 2026-11-04 — Clarified stale-version wording to the already-approved ADR 0020 "Replaced pass" and preserved real offline-scanner testing in dependent TICKET-065; contract tests here do not certify that future scanner flow.
- 2026-11-04 — in_progress → blocked — divine (codex) — Audit migration must follow PR89 migration0012; isolated base migration exited 1 during severe Docker memory pressure. Real database lifecycle tests and full verification remain incomplete.
- 2026-11-05 — blocked → in_progress — divine (codex) — Owner approved exact base update from develop 5747c3d and unchanged protected migration artifacts.
- 2026-11-05 — in_progress → blocked — divine (codex) — Audit migration0013 generated and reviewed; awaiting its distinct exact-path testing/commit authorization and isolated database capacity. Database and full integration verification remain incomplete.
- 2026-11-05 — blocked → in_progress — divine (codex) — Owner approved migration0013 isolated testing, commit and authorization record; database validation remains required.
- 2026-11-05 — in_progress → blocked — divine (codex) — Local verification and visual review pass; physical iOS/Android WhatsApp and safe-area checks or requested preview exception remain outstanding. Draft PR #99 contains evidence.
- 2026-11-08 — blocked → in_progress — divine (codex) — Owner authorizes completing integration and verified PR workflow; retain physical-device release gates.
- 2026-11-05 — in_progress → blocked — divine (codex) — Local verification and visual review pass; physical iOS/Android WhatsApp and safe-area checks or requested preview exception remain outstanding. Draft PR99 contains evidence.
- 2026-11-09 — in_progress → in_review — divine (codex)
