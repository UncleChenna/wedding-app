---
id: TICKET-057
title: Verify gate tokens on the scanner device
epic: checkin
status: in_progress
priority: high
estimate: M
labels: [security, frontend]
module: checkin
owner: divine
agent: codex
blocked_by: [TICKET-056]
blocks: [TICKET-059, TICKET-114]
branch: TICKET-057
pr: ""
created: 2026-10-21
updated: 2026-11-09
started: 2026-11-09
completed: ""
reason: ""
resume_to: ""
---

# TICKET-057: Verify gate tokens on the scanner device

## Context

Offline scanners must check signatures locally with only the public key, on older Android and iPhone browsers.

See: [Security](../docs/prd.md#security) · [Gate check-in](../docs/prd.md#gate-check-in) (CHK-6).

## Scope

- WebCrypto Ed25519 where supported; small pure-JS fallback (approved dependency) otherwise.
- Same code path tested in Node and the browser.
- Implementation targets: the repository-pinned Playwright Chromium and WebKit engines, with unsupported WebCrypto simulated to exercise the fallback. Record engine versions; these are development targets, not certified phone models or minimum OS versions.

## Out of scope

- Admission rules (TICKET-058).
- Physical scanner-device certification and the mandatory <20ms Android timing evidence (TICKET-114); actual-camera/low-light venue rehearsal remains TICKET-163.

## Acceptance criteria

- [ ] Valid tokens verify and tampered tokens fail in Chromium and WebKit Playwright projects.
- [ ] No private key material is shipped to the client bundle or cache (bundle/cache scan test).
- [ ] Shared valid, forged, tampered and expired-policy vectors pass in Node, Chromium and WebKit, including forced fallback when WebCrypto Ed25519 is unavailable. Follow the approved credential/freshness contract; do not invent a new token payload.
- [ ] Record automated per-token timings and exact browser/build versions against the <20ms target; clearly label these as automated evidence only. TICKET-114 retains the mandatory physical mid-range Android measurement, and automated timings do not certify hardware.

## Test plan

- Unit: Shared vectors with the server signer.
- End-to-end: Verify in Chromium and WebKit.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Unit/browser: forged/tampered/expired-policy token matrix and forced fallback. Manual physical token timings and realistic payload checks are mandatory in TICKET-114; timed low-light actual-camera scans remain mandatory in TICKET-163.

## Files likely touched

- `src/modules/checkin/lib/verify.ts`

## Notes / decisions

- 2026-11-09 (TICKET-220): Removed only the operational-roster dependency TICKET-055. Its physical timing and verification criteria are transferred verbatim to release-blocking TICKET-114, which still requires TICKET-055. No device result is passed or waived; software verification can proceed using the documented browser targets.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
- 2026-11-09 — todo → claimed — divine (codex)
- 2026-11-09 — todo → in_progress — divine (codex)
