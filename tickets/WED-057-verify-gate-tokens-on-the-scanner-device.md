---
id: WED-057
title: Verify gate tokens on the scanner device
epic: checkin
status: todo
priority: urgent
estimate: M
labels: [security, frontend]
module: checkin
owner: ""
agent: ""
blocked_by: [WED-056]
blocks: [WED-059]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# WED-057: Verify gate tokens on the scanner device

## Context

Offline scanners must check signatures locally with only the public key, on older Android and iPhone browsers.

See: [Security](../docs/prd.md#security) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- WebCrypto Ed25519 where supported; small pure-JS fallback (approved dependency) otherwise.
- Same code path tested in Node and the browser.

## Out of scope

- Admission rules (WED-058).

## Acceptance criteria

- [ ] Valid tokens verify and tampered tokens fail in Chromium and WebKit Playwright projects.
- [ ] Verification of one token takes <20ms on a mid-range Android (manual timing).
- [ ] No private key material is shipped to the client bundle (bundle scan test).

## Test plan

- Unit: Shared vectors with the server signer.
- End-to-end: Verify in Chromium and WebKit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

## Files likely touched

- `src/modules/checkin/lib/verify.ts`

## Notes / decisions

_Agents append dated notes here while working._

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
