# Progress log

Append-only. Newest entry at the bottom. A fresh agent session should read the last few entries before starting work.

Entry format:

```
## YYYY-MM-DD — <task id or "ad hoc"> — <title>
- **Done:** what changed (files, behaviour)
- **Learned:** surprises, gotchas, decisions (link ADRs)
- **Next:** the most useful next step
- **Checks:** pnpm verify ✔ / ✖ (why)
```

---

## 2026-10-21 — bootstrap — Project foundation

- **Done:** Next.js 16.4 + TypeScript strict + Tailwind 4 skeleton with feature modules (`src/modules/*`) and route groups `(guest)`, `(staff)`, `(admin)`. Theming system (JSON themes → server-rendered CSS variables → Tailwind tokens) with WCAG AA contrast gate and two themes. Base UI: Button, Card, Input, Sheet, Toast; `/dev/theme` showcase. Supabase local stack, Drizzle schema for 10 tables + first migration (RLS enabled on all), deterministic seed (110 invitations, 245 guests). Env loader (Zod, fail fast), logger, security headers, error/404 pages. Vitest + Playwright (mobile + desktop smoke), ESLint (bans colour literals), Prettier, Husky + lint-staged + commitlint, GitHub Actions CI. Agent harness: AGENTS.md + pointers, `.claude/` settings/hooks/commands/agents, `.mcp.json` (Playwright), `docs/tasks.json`, `scripts/agent-loop.sh`.
- **Learned:** Next 16.4 enables Cache Components + Partial Prefetching by default; error boundaries receive `retry` (not `reset`) and `error: unknown`. `next dev` rewrites a managed block at the top of AGENTS.md; keep it. With `"type": "module"`, JSON imports need `with { type: "json" }` for Playwright to load them. pnpm 12 fails installs on unapproved build scripts; approvals live in `pnpm-workspace.yaml` (`allowBuilds`). Supabase CLI now issues `sb_publishable_…` keys.
- **Next:** Run the setup-verification tasks in `docs/tasks.json`, then add the PRD to `docs/prd.md` and break it into tasks.
- **Checks:** pnpm verify ✔

## 2026-10-21 — SETUP-001 — Guard against horizontal overflow on phones

- **Done:** Added `e2e/overflow.spec.ts` (@smoke): loads `/`, `/invite`, `/order`, `/checkin`, `/kitchen`, `/admin`, `/dev/theme` at 375×812 and asserts `scrollWidth <= clientWidth` on `<html>`. Runs in the `mobile` project only (skipped in `desktop`). Plan: `docs/plans/2026-10-21-SETUP-001.md`.
- **Learned:** All routes passed first time, so no style fixes were needed. To prove the check works, a throwaway spec injected a 600px element and failed as expected (600 > 375); it was not committed. The `mobile` project's Pixel 7 device is 412px wide, so 375px checks must set the viewport themselves with `test.use({ viewport })`.
- **Next:** SETUP-005 (UI review of /dev/theme) is now unblocked.
- **Checks:** pnpm verify ✔ (17 smoke passed, 7 skipped by design)
