---
id: WED-176
title: Release invitations before the wedding-day feature launch
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [infra, test]
module: ops
owner: ""
agent: ""
blocked_by: [WED-005, WED-014, WED-028, WED-034, WED-035, WED-042, WED-043, WED-045, WED-046, WED-047, WED-048, WED-050, WED-051, WED-052, WED-091, WED-092, WED-101, WED-107, WED-120, WED-126, WED-131, WED-138, WED-140, WED-146, WED-148, WED-150, WED-152, WED-153, WED-170, WED-183, WED-185, WED-012, WED-027, WED-038, WED-119, WED-128]
blocks: [WED-154, WED-159, WED-177]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-176: Release invitations before the wedding-day feature launch

## Context

Backlog audit coverage: INV-1–7, milestone invitations week 2–3. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Release the usable invitation journey before the wedding-day staff and ordering application.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [ ] Deploy only the completed invitation/admin surfaces; unfinished order/scanner routes and actions are disabled by an explicit tested release boundary.
- [ ] Pass RSVP, tag-along meals, edit/lock, revoke/reissue, QR download, sharing, privacy and endpoint-abuse checks on the production domain; verify the invite on real iOS/Android WhatsApp.
- [ ] Confirm production account recovery, migrations, backups, tested restore and rollback, monitoring, invitation wording and owner approval before sending real invitations.
- [ ] Record deployed commit, URL, checks and rollback command. WED-154 remains the later full wedding-day release; no dependency on full ordering or scanner features.

- [ ] Before first send, record mobile invitation performance/accessibility scores of at least 95, CLS 0, keyboard/reduced-motion checks and zero applicable AA failures, independently of the later order-page hardening.

## Test plan

- End-to-end: production-safe synthetic invitation journey and negative disabled-route tests. Manual: signed release checklist, real-device evidence and recovery drill references; remove synthetic personal records under the approved procedure.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

- Audit verification: End-to-end/manual: invitation-only accessibility and mobile performance evidence on staging, followed by production smoke.

## Files likely touched

- docs/runbooks/; release configuration; e2e/

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
