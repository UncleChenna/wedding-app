# 0008 — AGENTS.md as the single source of truth for AI agents

- Status: Accepted · 2026-10-21 · task queue superseded by [0013](0013-ticket-system.md)

**Decision.** All agent guidance lives in `AGENTS.md`. `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md` and `.cursor/rules/agents.mdc` only point to it. Claude Code gets project settings (allowlist, deny rules, hooks), slash commands, subagents, and Playwright MCP. Long-running work is driven by `docs/tasks.json` + `docs/progress.md` + `scripts/agent-loop.sh` (headless, one task per run, independent `pnpm verify` gate).

**Consequences.** Change rules in one place. Hooks enforce format/lint on every edit and `verify:quick` before stopping; the loop refuses to continue on a failed gate.
