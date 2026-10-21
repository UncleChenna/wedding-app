@AGENTS.md

# Claude Code notes

- `AGENTS.md` (imported above) is the source of truth. Don't duplicate rules here.
- Slash commands: `/plan <task>`, `/implement <task-id>`, `/verify`, `/review` (in `.claude/commands/`).
- Subagents: `code-reviewer`, `test-writer`, `ui-reviewer` (in `.claude/agents/`). Use `test-writer` for step 4 of the loop and `code-reviewer` + `ui-reviewer` before committing UI work.
- Hooks (`.claude/settings.json`): every Edit/Write runs Prettier + ESLint on that file; errors come back to you — fix them. Before you stop, `pnpm verify:quick` runs on changed work; if it fails you will be asked to keep going.
- Playwright MCP (`.mcp.json`) lets you open pages in a real browser: run `pnpm dev` first, then browse `http://localhost:3000`.
- Reading `.env*` files is denied. Use `.env.example` to learn variable names.
