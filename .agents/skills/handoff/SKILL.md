---
name: handoff
description: Use before ending an implementation session or transferring work to another person or agent; preserve a dated, actionable record.
---

# Handoff

1. Read `docs/handoffs/README.md` and the relevant ticket handoff. `docs/progress.md` is historical, read-only context.
2. Write or update only `docs/handoffs/<ticket-id>.md`. Include date/time, owner, agent, ticket id, branch, changed files, checks actually run, lessons, blockers, and exact next action.
3. Keep incomplete work claimed and push it. If you cannot continue, `pnpm t:move <id> blocked --reason "…" --push` with the blocking ticket or question. Release only a claimed `todo` ticket you are handing back deliberately: `pnpm t:release <id>`.
4. Append a dated line to the ticket's "Notes / decisions" section summarising the state.
5. If the same mistake happened twice, propose a specific hook, skill, or documentation fix. Record verified project-specific fixes in that ticket’s handoff; consolidate shared learnings in a dedicated maintenance ticket.
6. Report commit/PR links when they exist, and clearly separate tested results from unverified checks.
