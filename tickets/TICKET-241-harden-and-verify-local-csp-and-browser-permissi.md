---
id: TICKET-241
title: Harden and verify local CSP and browser permissions before deployment
epic: security
status: done
priority: high
estimate: S
labels: [security]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-033, TICKET-059, TICKET-105]
blocks: [TICKET-124]
branch: TICKET-241
pr: https://github.com/UncleChenna/wedding-app/pull/199
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-241: Harden and verify local CSP and browser permissions before deployment

## Context

TICKET-124 combines local policy implementation with HTTPS staging and production evidence. TICKET-149 has not started, so local work is split here while every deployment acceptance requirement stays mandatory in TICKET-124. See [Security](../docs/prd.md#security).

## Scope

- Audit CSP and Permissions-Policy against implemented camera, worker, local font and Supabase realtime requirements.
- Fix concrete policy/input-validation gaps without widening unrelated origins or weakening existing protections.
- Add focused unit and actual production-browser coverage for delivered headers, allowed same-origin capabilities and blocked external script injection.
- Add an ADR 0006 addendum and retain TICKET-124 as the deployment verification gate, dependent on this implementation and TICKET-149.

## Out of scope

- Nonce-based CSP, new external services, production deployment, a claimed securityheaders.com grade, or physical-device verification.

## Acceptance criteria

- [x] Configured Supabase connection origins are restricted to valid HTTP(S) origins and their corresponding websocket origins; invalid protocols/credentials cannot create permissive directives.
- [x] Focused policy tests retain existing framing, objects, camera, worker, font and production eval restrictions.
- [x] Actual production-browser checks assert delivered headers, a blocked unauthorized script and functioning same-origin worker/font access without unexpected CSP violations.
- [x] ADR and TICKET-124 retain all HTTPS staging, production smoke and grade-A evidence requirements; no incomplete deployment check is marked done.

## Test plan

- Unit: security-headers tests for trusted origins, invalid configuration and existing protection invariants.
- End-to-end: real production responses, violation events and same-origin capabilities; intentional blocked-script evidence is separate from positive-path console guards.
- Gate: verify:quick; existing required CI remains intact.

## Files likely touched

- `src/modules/shared/lib/security-headers.ts`
- `src/modules/shared/__tests__/security-headers.test.ts`
- `e2e/smoke.spec.ts`
- `docs/decisions/0006-security-headers.md`
- `tickets/TICKET-124-review-security-headers-and-csp-for-camera-worke.md`

## Notes / decisions

2026-11-13: Authorized implementation/verification split; TICKET-149 remains unstarted and no deployment evidence is implied. All 13 policy tests pass after reproduced invalid-host failures. Actual initial browser checks exposed the Zod evaluation probe; early named-mini jitless initialization repairs it in Next and standalone scanner entries. Final six mobile/desktop policy cases pass in 7.0 seconds; production build passes and independent review is clean. See docs/plans/TICKET-241-pr.md.

## Activity log

- 2026-11-13 — new → backlog — divine (codex)
- 2026-11-13 — backlog → todo — divine (codex)
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
- 2026-11-13 — in_progress → in_review — divine (codex)
