# 0007 — Vitest + Playwright, one `pnpm verify` gate

- Status: Accepted · 2026-10-21

**Decision.** Vitest for unit tests (node by default, jsdom per file). Playwright for e2e on a Pixel 7 and a 1280px desktop, against the production build. `pnpm verify` = format check → lint → typecheck → unit → build → e2e smoke, and CI runs exactly `pnpm verify`. `pnpm verify:quick` (lint, typecheck, tests related to changed files) gives fast feedback and backs the agent Stop hook.

**Consequences.** One command answers "is it done?" for humans, agents and CI. Smoke tests must stay fast; full e2e runs with `pnpm test:e2e`.
