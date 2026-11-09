# Ticket

Ticket: TICKET-220

# Summary

Scanner software was blocked by the human operator/device roster despite the completed signer and admin staff/device management. TICKET-057 can now be implemented against documented automated browser targets, while actual device certification stays mandatory before release.

# Changes

- Remove only the TICKET-055 → TICKET-057 implementation prerequisite; retain TICKET-056.
- Transfer both physical verification criteria verbatim from057 into114: <20ms on a mid-range Android, and realistic-payload signature/expiry verification with no browser/cache private signing key.
- Make114 explicitly depend on057 as well as its existing055/113/149 prerequisites. Its154/163 release/rehearsal gates remain unchanged.
- Preserve actual-camera, timed low-light venue scans explicitly in163. Clarify055 as incomplete operational readiness, distinct from admin-managed accounts/roles.
- Define057's software evidence as pinned Chromium/WebKit/Node vectors, forced unsupported-WebCrypto fallback, bundle/cache exclusion and clearly labelled automated timing against the20ms target. Emulation does not certify phone models or replace manual timing.

# Acceptance criteria and evidence

- PASS: Live ownership inspection found055/057/114/163 all todo and unowned before editing.056,064,096 are complete in the shared ledger.
- PASS: Exact-string comparison against the pre-change057 definition proves both physical criteria were transferred verbatim to114. All four edited ticket statuses/owners/agents remain unchanged and all their acceptance criteria remain unchecked.
- PASS:138,154,161,162 definitions remain byte-identical.055 still blocks114/138/161/162;114 still blocks154/163.163 retains its original prerequisites and rehearsal gate. No requirement or human completion has been fabricated.
- PASS:217 ticket definitions validate, including dependency existence and acyclicity; rendering writes only ignored local artifacts. The next scanner implementation prerequisite is completed056.

# Verification

- `pnpm t:validate`:217 tickets valid, no cycles or missing dependencies.
- `pnpm t:render`: local ignored BOARD/ROADMAP snapshots rendered.
- `pnpm exec vitest run scripts/__tests__/tickets.test.ts scripts/__tests__/ticket-review.test.ts scripts/__tests__/ticket-prefix.test.ts`:55 tests passed across3files, including graph/workflow checks.
- Exact-preservation/readiness assertions: both transferred strings match; all four statuses unchanged; no human criteria checked; unchanged release/training/WhatsApp/runbook definitions.
- `pnpm verify:quick`: lint and types passed; no changed application source, so no related unit tests selected. Full CI remains required before merge.
- New220 created/claimed through t:new/t:start with the shared ledger's reserved-ID mechanism. Only its own definition was carried into its worktree from develop716695ca. No unrelated unmerged definition or feature commits copied.

# Risks and rollout

Documentation/backlog change only: no application, migration, dependency, security policy or CI configuration change. This permits software implementation; it does not claim older hardware support has been demonstrated. Actual operator assignments, device/OS/browser details, physical timing/verification, installation, training and venue rehearsal remain outstanding human work. Revert this ticket to restore the prior scheduling edge. The ticket split is traceable in055/057/114/163 notes.

# Screenshots

N/A: no UI or runtime changes.

# UI checklist

N/A: dependency definitions and review evidence only; no UI, font, motion, QR, device-performance or accessibility result is newly claimed.

# Harness changes, if any

Only scoped ticket definitions; no AGENTS, skills, scripts, hooks or policy changes. Root review requested before merge; draft PR until reviewed.
