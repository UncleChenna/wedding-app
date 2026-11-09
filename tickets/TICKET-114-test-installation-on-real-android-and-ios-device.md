---
id: TICKET-114
title: Test installation on real Android and iOS devices
epic: pwa
status: todo
priority: high
estimate: S
labels: [human, pwa, test]
module: ops
owner: ""
agent: ""
blocked_by: [TICKET-113, TICKET-149, TICKET-055, TICKET-057]
blocks: [TICKET-154, TICKET-163]
branch: ""
pr: ""
created: 2026-10-21
updated: 2026-10-21
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-114: Test installation on real Android and iOS devices

## Context

Emulation does not prove install, icons, splash screens or offline behaviour on real phones.

See: [Usability and accessibility](../docs/prd.md#usability-and-accessibility) · [What "flawless" means in testing](../docs/prd.md#what-flawless-means-in-testing).

## Scope

- Install from the production URL on one iPhone and one Android; check icon, splash, offline pass and scanner.

## Out of scope

- Automated implementation evidence (TICKET-057 and TICKET-113); it does not satisfy these physical-device checks.

## Acceptance criteria

- [ ] Device models, OS versions and results recorded in notes with screenshots.
- [ ] Any failure has a linked fix-up ticket.

- [ ] Run on the staging HTTPS deployment before full production release. Any required-device failure blocks sign-off until fixed and retested.

- [ ] Verification of one token takes <20ms on a mid-range Android (manual timing).
- [ ] Verify signatures and expiry using realistic payload lengths on the physical device set; no private signing key ships to a browser or cache.

- [ ] Record physical device/model/OS/browser/build, realistic payload lengths, signature/expiry results and measured token timings. Test the actual scanner device set from TICKET-055, including a mid-range Android and an iPhone; failures or missing evidence block release sign-off.

## Test plan

- Manual: Real devices.
- Gate: `pnpm verify` passes; UI tickets also record the UI checklist (docs/ui-checklist.md).

- Audit verification: Manual: record real iOS/Android device results for guidance, installation, standalone offline launches and safe update.

## Files likely touched

- `docs/runbook.md`

## Notes / decisions

- 2026-11-09 (TICKET-220): The two physical token-verification criteria above are transferred verbatim from TICKET-057. The <20ms measurement remains a required hardware check, not a desktop timing claim. TICKET-055 remains a prerequisite; TICKET-154 and TICKET-163 remain blocked until these checks pass.

- 2026-10-21: Needs a person (decision, account or physical task). Agents may prepare docs and record the outcome.

## Activity log

- 2026-10-21 — new → todo — UncleChenna (claude) — created from the PRD and docs/current-state.md
