# 0009 — Portable skills and generated Claude distribution

- Status: Accepted · 2026-10-21

**Context.** Multiple agents and two people need one workflow source. Vendor-specific copies drift.

**Decision.** Author Agent Skills in `.agents/skills/`. Codex and Cursor discover that path directly; link Claude's `.claude/skills/`, with a copy fallback refreshed by `agents:link`. Root instructions become an index. Generate the Claude plugin from these sources; keep distribution copies ignored. Remove the duplicated implementation slash command.

**Consequences.** Run linking after updates and plugin build before sharing. Plugin cache contains real files, not external symlinks that break on installation. Canonical docs remain in the repository. Official format references are recorded in `docs/agent-tooling-sources.md`.
