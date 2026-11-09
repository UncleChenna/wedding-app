@AGENTS.md
@docs/design-principles.md
@docs/ui-checklist.md

# Claude integration

Shared skills are linked into `.claude/skills/` by `pnpm agents:link`.
Use `/ticket-workflow` to pick, claim and close a ticket and `/implement-task <id>` to build it.
Commit attribution is disabled in `.claude/settings.json`; never add AI trailers by hand. `/plan`, `/verify`, and `/review`
remain convenience commands. Reviewers follow the canonical docs and UI skill.
Project hooks delegate to `scripts/harness/hooks.mjs`. A failing `verify:quick` still fails the stop hook. Protected files waiting on the owner are only reported there and are enforced at commit.
See `docs/collaboration.md` for plugin setup, trust, worktrees and explicit exceptions.
