---
id: TICKET-125
title: Document and enforce secrets handling and key rotation
epic: security
status: in_progress
priority: urgent
estimate: M
labels: [security, docs]
module: shared
owner: divine
agent: codex
blocked_by: [TICKET-029, TICKET-056]
blocks: [TICKET-148]
branch: TICKET-125
pr: ""
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-125: Document and enforce secrets handling and key rotation

## Context

Signing keys, Supabase service keys and WhatsApp tokens must stay server-side and be rotatable.

See: [Security](../docs/prd.md#security).

## Scope

- Env schema for every secret (server-only).
- docs/security.md: where each lives, who has access, rotation steps.
- Test that no secret-named var is exposed as NEXT_PUBLIC.

## Out of scope

- Vault products.

## Acceptance criteria

- [ ] Build fails if a secret is referenced from client code (test/lint).
- [ ] Rotation steps exist for every secret.

## Test plan

- Unit: Env schema tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/shared/lib/env/schema.ts`
- `docs/security.md`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-01 — todo → claimed — divine (codex)
- 2026-11-01 — todo → in_progress — divine (codex)
