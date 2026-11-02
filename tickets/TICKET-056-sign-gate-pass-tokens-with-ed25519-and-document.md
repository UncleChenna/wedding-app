---
id: TICKET-056
title: Sign gate pass tokens with Ed25519 and document key handling
epic: checkin
status: in_review
priority: urgent
estimate: M
labels: [security, backend]
module: checkin
owner: unclechenna
agent: claude
blocked_by: [TICKET-023, TICKET-169]
blocks: [TICKET-043, TICKET-044, TICKET-057, TICKET-125, TICKET-130, TICKET-183]
branch: TICKET-056
pr: https://github.com/UncleChenna/wedding-app/pull/70
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-056: Sign gate pass tokens with Ed25519 and document key handling

## Context

The QR carries an Ed25519-signed token that scanners verify without the server; scanners hold only the public key.

See: [Security](../docs/prd.md#security) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6) · [Current state](../docs/current-state.md).

## Scope

- ADR: payload (invitation id, token_version, party size, issued-at), compact encoding, `/p/<signed>` URL so phone cameras open the pass.
- Server signing with a private key from env; public key endpoint.
- Key rotation procedure.

## Out of scope

- Device verification (TICKET-057).

## Acceptance criteria

- [x] Signing and verifying round-trip; any tampered byte fails (unit, 1k fuzz cases).
- [x] The private key is only read server-side (`server-only` import; lint/test).
- [x] ADR merged with rotation steps.

## Test plan

- Unit: Sign/verify and tamper tests.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/lib/gate-token.ts`
- `src/modules/checkin/server/signing.ts`
- `docs/decisions/`

## Notes / decisions

_Agents append dated notes here while working._

- 2026-11-01:
  - **Payload.** It follows the approved ADR 0020: `{v, kid, inv, ver, iat}`. The scope line above mentions party
    size, but ADR 0020 row 7 keeps the allowance out of the pass and reads it from the scanner's guest list, so
    the ADR wins.
  - **Public key route.** It's `GET /api/gate-keys`. The `/p/<signed>` pass page is TICKET-183.
  - **Verification.** It uses WebCrypto Ed25519, so it can run unchanged on scanners (TICKET-057). No dependency
    was added.
  - **Rotation.** Steps are in ADR 0021, which is part of this PR. The "ADR merged" criterion holds once the PR
    merges.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-01 — todo → claimed — unclechenna (claude)
- 2026-11-01 — todo → in_progress — unclechenna (claude)
- 2026-11-01 — in_progress → in_review — unclechenna (claude)
