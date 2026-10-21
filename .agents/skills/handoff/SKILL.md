---
name: handoff
description: Use before ending an implementation session or transferring work to another person or agent; preserve a dated, actionable record.
---

# Handoff

1. Read the template at the top of `docs/progress.md`.
2. Prepend a new entry below the template without rewriting prior entries. Include date/time, owner, agent, ticket id, branch, changed files, checks actually run, lessons, blockers, and exact next action.
3. Keep incomplete work claimed and push it. If you cannot continue, `pnpm t:move <id> blocked --reason "…" --push` with the blocking ticket or question. Release only a claimed `todo` ticket you are handing back deliberately: `pnpm t:release <id>`.
4. Append a dated line to the ticket's "Notes / decisions" section summarising the state.
5. If the same mistake happened twice, propose a specific hook, skill, or documentation fix. Add verified project-specific fixes to `docs/learnings.md`.
6. Report commit/PR links when they exist, and clearly separate tested results from unverified checks.
