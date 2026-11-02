# TICKET-022 — seed palette generator

2026-11-02 · divine · codex · branch TICKET-022.
Base develop: 2f066ebbb175c4b8d42b0ab6f54545134f52f592.
Managed stack wedding-a5c5efe207a3; app28750, browser28751, database28741.

## Implementation

Pure generateTheme validates one/two hex seeds and identity/scheme, returns expected errors for invalid input, and derives a complete Theme. Approved baseline surfaces/status/QR/font/radius/shadow values stay intact. Brand text/control colours are adjusted against actual surfaces; decorative fill preserves the second seed exactly. Output passes loadTheme. No registry activation, editor UI, migration or dependency changes. docs/theming.md documents the API and required later visual review in TICKET-098.

## Verification

The initial regression suite failed because the generator module did not exist. All66 new tests now pass:28 seeds (20 deterministic pseudorandom plus8 extremes) in both schemes, status equality, AA, QR polarity, deterministic independent objects, second-seed behavior and invalid-input handling. All145 theming tests pass. Quick gate passes lint/types/98 related tests. Full gate has passed format, lint, types and722 unit tests (27 skipped); production build/browser phase remains in progress. Do not claim full verification yet.

No visible UI or active theme changes: screenshot, device, motion and Lighthouse checks are not evidence for this pure API. Generated palettes require visual review when integrated; existing release gates remain mandatory.

## Setup and next action

Initial wt:new ended with a Supabase startup failure while containers were becoming healthy. Retried via the managed wt:new command after confirming termination; retry is still running. Do not restart a live setup. Current setup tool session92203; full verification session95834. Resume those handles, inspect terminal results, finish verification, update evidence and PR body, then pnpm t:pr TICKET-022. Latest repository rules leave merge to the human.
