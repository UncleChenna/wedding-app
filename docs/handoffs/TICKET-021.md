# TICKET-021 handoff

## 2026-10-27 — TICKET-021 — UI review of /dev/theme in every theme and width

- **Who / agent / branch:** unclechenna · claude · `TICKET-021`, base `develop` 14712ac.
- **Changed:** `Button` no longer animates `outline-color` (focus ring was invisible for 150ms); `StatusPanel` names use `wrap-anywhere` (long names no longer stretch the grid at 375px); long-name sample on `/dev/theme`; new `e2e/theme-review.spec.ts`.
- **Checks:** theme-review 8/8 (failed before the fixes); review e2e set 108 passed; shared unit 124 passed; `pnpm verify` via `t:pr`.
- **Not verified:** Lighthouse, real devices.
- **Deferred:** disabled/loading button opacity contrast (revisit in TICKET-040/072); mid-word breaks for very long names.
- **Learned:** `transition-colors` includes `outline-color`; use explicit properties on focusable controls. `overflow-wrap: break-word` does not shrink min-content in grids; use `anywhere`. Many open worktrees each run a Supabase stack, and new stacks stop becoming healthy; stop idle stacks with `pnpm db:stop` in their worktrees.
- **Next:** remaining tickets mostly wait on TICKET-025/171/172 (divine) or owner decisions.
