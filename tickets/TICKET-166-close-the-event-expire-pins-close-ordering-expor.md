---
id: TICKET-166
title: "Close the event: expire PINs, close ordering, export memories"
epic: launch
status: in_review
priority: medium
estimate: M
labels: [backend, docs]
module: admin
owner: divine
agent: codex
blocked_by: [TICKET-096, TICKET-080, TICKET-088]
blocks: [TICKET-154, TICKET-167, TICKET-168]
branch: TICKET-166
pr: https://github.com/UncleChenna/wedding-app/pull/105
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-05
completed: ""
reason: ""
resume_to: ""
---

# TICKET-166: Close the event: expire PINs, close ordering, export memories

## Context

After the wedding, staff access ends and the couple keep non-personal memories (counts, timeline, menu stats) before data is deleted.

See: [Security](../docs/prd.md#security) · [Privacy (UK GDPR)](../docs/prd.md#privacy-uk-gdpr).

## Scope

- Admin action: expire all PINs, close ordering, revoke devices.
- Export a memories pack (anonymous stats, RSVP counts, menu popularity) as PDF/CSV.

## Out of scope

- Deletion (TICKET-168).

## Acceptance criteria

- [x] After the action no staff session works (e2e).
- [x] The memories export contains no contact details or dietary notes (test).

- [x] Implement and rehearse event closure on synthetic data before release; actual production closure requires the approved event time and human confirmation. Expire PINs and ordering without deleting unsynced admission evidence.

## Test plan

- Unit: Export contents.
- End-to-end: Close event.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: End-to-end: pre-event premature closure blocked, authorized post-event closure and repeat invocation are idempotent.

## Files likely touched

- `src/modules/admin/`

## Notes / decisions

2026-11-09 final integration: develop 360914b7. Independent review found legacy check-in counting missed current admissions and counted legacy overflow. Real red regressions proved both errors; canonical admitted-people sum now passes, including actual backfill and partial arrivals without double-counting. All 26 integrated DB tests, production build and authenticated closure/browser rehearsal pass; all 16 screenshots match reviewed captures. Physical-device checks remain unchecked in release-blocking TICKET-201. Final quick lint/types pass; independent review of the fix and regression is clean. Final-head CI remains required before merge.

2026-11-09: Owner standing authorization resolves the preview-only permission blocker; physical keyboard, safe-area and memories-download checks remain unchecked in release-blocking TICKET-201. Integrated develop fffe7b8d cleanly; eight focused non-database suites / 53 tests pass. Current quick checks pass lint, types and 324 related tests (89 skipped); final-head CI remains pending. Prior full/database/browser evidence is retained in the handoff; no new database was started or production closure attempted.

2026-11-06: Added internal anonymous PDF renderer alongside the CSV foundation.
Six PDF tests and verify:quick pass; native ivory PDF text/raster inspected.
Database integration, authenticated download, closure/revocation and full review
remain unfinished. Draft PR105; see docs/handoffs/TICKET-166.md.

2026-11-06: Added private CSV/PDF download routes and aggregate query. Nine boundary
tests, lint and types pass. One guarded database test is prepared but skipped;
the owned database is absent. Query execution, full route integration and event
closure/revocation remain unverified; no acceptance criterion is marked complete.

2026-11-06: Implemented authorized closure transaction/action and matching ordering
settings lock/expiry recheck. Eight action tests, lint and types pass. Database
closure, session and concurrency rehearsals remain unrun; admin navigation/UI and
full verification remain unfinished. No production action or data deletion occurred.

2026-11-06: Added protected closure page and control-room navigation. Quick gate
passes lint/types/117 related tests (one opt-in skip). All-theme browser, database,
session/concurrency and device verification remain outstanding; UI review incomplete.

2026-11-06: Native PDF review found and fixed missing page numbers. All four themes
and the seven-page menu pass native A4/page-number/privacy checks; six renderer
tests and quick verification pass. No database/browser/device completion claimed.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-05 — todo → claimed — divine (codex)
- 2026-11-05 — todo → in_progress — divine (codex)
- 2026-11-05 — in_progress → blocked — divine (codex) — Isolated Supabase startup terminated with failure; no owned database container exists. Pure closure/export foundations pushed; database recovery and integration pending.
- 2026-11-06 — blocked → in_progress — divine (codex)
- 2026-11-06 — in_progress → blocked — divine (codex) — Closure-specific database and staff-session rehearsals require the isolated stack; Docker has only 537MB available. Awaiting permission to stop idle owned TICKET-048 with its backup preserved.
- 2026-11-06 — in_progress → blocked — divine (codex) — Automated database, browser and UI verification passed. Awaiting review-only exception for physical-phone keyboard/safe-area and downloads; retain release checks. No PR merge authorized.
- 2026-11-09 — blocked → in_progress — divine (codex) — Owner standing authorization permits preview progress while preserving explicit physical-device release gates; integrate latest develop and verify.
- 2026-11-09 — in_progress → in_review — divine (codex)
