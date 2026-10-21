---
name: handoff
description: Use before ending an implementation session or transferring work to another person or agent; preserve a dated, actionable record.
---

# Handoff

1. Read the template at the top of `docs/progress.md`.
2. Prepend a new entry below the template without rewriting prior entries. Include date/time, owner, agent, task, branch, changed files, checks actually run, lessons, blockers, and exact next action.
3. Keep incomplete work claimed; add a blocked_reason when necessary. Release only when handing it back deliberately, using `pnpm task:release <id>`.
4. If the same mistake happened twice, propose a specific hook, skill, or documentation fix. Add verified project-specific fixes to `docs/learnings.md`.
5. Report commit/PR links when they exist, and clearly separate tested results from unverified checks.
