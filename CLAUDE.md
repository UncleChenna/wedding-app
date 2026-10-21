@AGENTS.md
@docs/design-principles.md
@docs/ui-checklist.md

# Claude integration

Shared skills are linked into `.claude/skills/` by `pnpm agents:link`.
Use `/implement-task <id>` for implementation. `/plan`, `/verify`, and `/review`
remain convenience commands. Reviewers follow the canonical docs and UI skill.
Project hooks delegate to `scripts/harness/hooks.mjs`; no failing-stop escape hatch.
See `docs/collaboration.md` for plugin setup, trust, worktrees and explicit exceptions.
