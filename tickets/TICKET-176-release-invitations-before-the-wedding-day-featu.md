---
id: TICKET-176
title: Release invitations before the wedding-day feature launch
epic: deployment
status: todo
priority: urgent
estimate: M
labels: [infra, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-005, TICKET-014, TICKET-028, TICKET-034, TICKET-035, TICKET-042, TICKET-043, TICKET-045, TICKET-046, TICKET-047, TICKET-048, TICKET-050, TICKET-051, TICKET-052, TICKET-091, TICKET-092, TICKET-101, TICKET-107, TICKET-120, TICKET-126, TICKET-131, TICKET-138, TICKET-140, TICKET-146, TICKET-148, TICKET-150, TICKET-152, TICKET-153, TICKET-170, TICKET-183, TICKET-185, TICKET-012, TICKET-027, TICKET-038, TICKET-119, TICKET-128]
blocks: [TICKET-154, TICKET-159, TICKET-177]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-176: Release invitations before the wedding-day feature launch

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
- [ ] Record deployed commit, URL, checks and rollback command. TICKET-154 remains the later full wedding-day release; no dependency on full ordering or scanner features.

- [ ] Before first send, record mobile invitation performance/accessibility scores of at least 95, CLS 0, keyboard/reduced-motion checks and zero applicable AA failures, independently of the later order-page hardening.

- [ ] Before first send, the owner supplies actual venue/time/dress-code/map details as applicable and a valid venue time zone; the configured RSVP cutoff is verified against 2026-12-19 00:00 in that zone. TBD values are not treated as release-ready.

## Test plan

- End-to-end: production-safe synthetic invitation journey and negative disabled-route tests. Manual: signed release checklist, real-device evidence and recovery drill references; remove synthetic personal records under the approved procedure.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

- Audit verification: End-to-end/manual: invitation-only accessibility and mobile performance evidence on staging, followed by production smoke.

## Files likely touched

- docs/runbooks/; release configuration; e2e/

## Notes / decisions

- 2026-10-26: Owner explicitly deferred Apple/Google Wallet on 2026-10-26. Launch still requires QR/image/PDF and offline-pass journeys; do not require issuer accounts or claim Wallet is implemented. Event details are currently TBD; see docs/prd.md#approved-event-defaults.

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.

## Activity log

- 2026-10-21 — new → todo — divine
