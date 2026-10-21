# Progress log

Add-only history, newest first: prepend new entries below this template, never rewrite old entries. Legacy entries below retain their original wording; authors/agents were not recorded at the time.

```markdown
## YYYY-MM-DD HH:mm UTC — TASK-ID — Title

- **Who / agent / branch:** owner · agent · branch
- **Changed:** files and resulting behaviour
- **Checks:** commands actually run, results, and unverified checks
- **Learned:** project-specific facts or repeated-mistake harness fix
- **Next / blockers:** exact next action, ownership and outstanding prerequisites
```

---

## 2026-10-21 05:55 UTC — TICKETS — Ticket system and full backlog

- **Who / agent / branch:** UncleChenna · Claude Code · `chore/ticket-system` (from `2f8dc47`, the committed HARNESS-001/DESIGN-001 work)
- **Changed:** Replaced `docs/tasks.json` and `scripts/task.mjs`/`task-pr.mjs` with `tickets/` + `scripts/tickets.ts` (`pnpm t:*`, ADR 0013), with live claims on `origin/ticket-ledger`. Wrote 168 tickets (WED-001–WED-168) across 16 epics, generated `tickets/BOARD.md` and `tickets/ROADMAP.md`, transcribed the PRD PDF to `docs/prd.md`, and audited the repo in `docs/current-state.md`. Added the `ticket-workflow` skill, the AGENTS.md workflow and the no-AI-attribution rule. Added a `commit-msg` hook (`scripts/harness/commit-rules.mjs`), CI `tickets` and `pr-text` jobs, and `t:validate` in pre-commit and `pnpm verify`. Turned off attribution in `.claude/settings.json` and `.codex/config.toml`. `worktree.mjs` and `agent-loop.mjs` now use tickets.
- **Checks:** Baseline `pnpm verify` passed before the change. After the change: script unit tests (tickets, harness, hooks, seed) pass, `t:validate` and `t:render` pass, and the final `pnpm verify` result is recorded in the PR. Not verified: claims against GitHub (WED-007), worktree lifecycle (WED-006), CI on GitHub (WED-004).
- **Learned:** An exported-but-empty env var defeats `??` fallbacks; use `||` for identity lookups. The harness hooks block reads outside the checkout and give false positives on shell commands that merely mention protected paths (WED-001, WED-002). Commit `2f8dc47` carries a Claude co-author trailer; history was not rewritten.
- **Next / blockers:** Agents: `pnpm t:next` (WED-001 first). People: the "Waiting on people" list in `tickets/BOARD.md` (Vercel, Supabase, domain, colours, WhatsApp API, venue visit). Divine: decide whether SPIKE-001 (`../wedding-design-spike`) folds into WED-037 or is cancelled.

## 2026-10-21 05:15 UTC — HARNESS-001 — Two-person parallel agent harness

- **Who / agent / branch:** Divine · Codex · `divine/HARNESS-001-collaboration` (implementation request predates the new claim tooling; no origin is configured).
- **Changed:** Six portable skills; Claude skill linking/copy fallback; Codex/Claude/Cursor shared hooks; isolated Supabase worktree/port tooling; atomic remote claim ledger and PR lifecycle; generated Claude plugin/marketplace; ownership, PR template, disabled AI review and unexecuted branch-protection script; 102-line root instructions, onboarding, learnings and ADRs 0009–0012. Existing design rules preserved; no components/pages changed. The user-owned PRD PDF was not edited or included in test fixtures.
- **Checks:** `agents:link` repeated successfully in symlink and forced-copy modes; `agents:check`, shell syntax, formatting, lint, types, and 52 unit tests pass. Disposable two-clone race permits exactly one claim; duplicate claims, foreign releases and stale snapshots are rejected. Protected edits, malformed hook requests, repeated failing stops and direct main pushes are tested. Main commit guard and dirty-worktree removal guard reject as expected. Claude validates and installs the plugin using temporary settings; inventory confirms 6 skills, 3 reviewers and 3 hook events. The standalone Python skill validator could not run because PyYAML is absent; internal skill checks and actual Claude discovery passed.
- **Integration:** In a disposable repository, `wt:new demo-task` installed dependencies, started a separate Supabase project and allocated app/browser ports 35070/35071. Full `pnpm verify` passed in both its main-branch fixture and demo worktree: 52 unit tests, production build, 17 browser smoke passes, 7 existing desktop skips. Two demo resets/migrate/seeds succeeded (110 invitations, 245 guests, 28 tables, 16 menu items); original database guest-row/timestamp fingerprint stayed unchanged. Final worktree gate passed again after hook fixes. Repeating setup retained its ports and database. Clean `wt:remove` stopped/deleted only the demo stack; a second removal was a successful no-op, and only the original stack remained.
- **Learned:** Codex now supports `.codex/hooks.json`; Cursor reads `.agents/skills` directly. Remote SHA leases prevent cross-machine lost claims; stale clients must retain unknown ledger tasks. Repeated primary-checkout Turbopack failures are environment-specific: the same source builds in the disposable checkout. The harness fix is explicit failure reporting and isolated verification, never a weakened gate. A trailing slash in a Git ignore pattern does not cover a directory symlink; the generated `.claude/skills` alias now uses the correct ignore pattern.
- **Next / blockers:** Primary checkout `pnpm verify` still fails at Turbopack port binding (`Operation not permitted`), even with escalation; no real main merge/PR is claimed. Retain the claim and leave changes uncommitted until that gate can run in the intended environment. Configure origin, replace CODEOWNERS handles, and run branch-protection setup manually. AI review remains disabled; enabling it requires human approval of costs, `OPENAI_API_KEY`, and `ENABLE_AI_REVIEW=true`.

## 2026-10-21 — DESIGN-001 — Explicit Claude integration

- **Done:** Added direct imports of both canonical design documents to `CLAUDE.md`; updated Claude implementation/review commands and UI/code reviewers to require the shared rules and checklist evidence. Removed the UI reviewer's duplicate design checklist.
- **Learned:** Claude now receives the documents through its entrypoint imports as well as explicit workflow references.
- **Next:** DESIGN-001 remains blocked on the previously recorded Turbopack port-binding restriction; rerun full verification in a permitted environment before completion and commit.
- **Checks:** Documentation formatting and diff whitespace checked. No application code changed; the existing full-build blocker remains unresolved.

## 2026-10-21 — DESIGN-001 — Shared frontend design rules

- **Done:** Added canonical design principles and a pass/fail UI checklist; added 29-line `src/AGENTS.md`; linked root, Claude, Gemini, Cursor, and Copilot instructions to the shared documents; updated the definition of done. No components or pages changed.
- **Learned:** Retained the existing WCAG 2.2 AA baseline. Staff semantic status colours are an explicit exception to the guest palette and still require tokens. Documentation links resolve and nested instructions meet the 40-line limit.
- **Next:** Blocked on the local execution environment: rerun `pnpm verify` where Turbopack can bind a local port, then mark DESIGN-001 done and commit. Changes remain uncommitted under the blocked-task rule.
- **Checks:** `pnpm verify:quick` passed; full verification passed formatting, lint, typecheck, and all 39 unit tests, then failed at build with `binding to a port: Operation not permitted (os error 1)`. An escalated retry produced the same failure; browser smoke tests were not reached. UI screenshots are not applicable to this documentation-only task.

## 2026-10-21 — SETUP-001 — Guard against horizontal overflow on phones

- **Done:** Added `e2e/overflow.spec.ts` (@smoke): loads `/`, `/invite`, `/order`, `/checkin`, `/kitchen`, `/admin`, `/dev/theme` at 375×812 and asserts `scrollWidth <= clientWidth` on `<html>`. Runs in the `mobile` project only (skipped in `desktop`). Plan: `docs/plans/2026-10-21-SETUP-001.md`.
- **Learned:** All routes passed first time, so no style fixes were needed. To prove the check works, a throwaway spec injected a 600px element and failed as expected (600 > 375); it was not committed. The `mobile` project's Pixel 7 device is 412px wide, so 375px checks must set the viewport themselves with `test.use({ viewport })`.
- **Next:** SETUP-005 (UI review of /dev/theme) is now unblocked.
- **Checks:** pnpm verify ✔ (17 smoke passed, 7 skipped by design)

## 2026-10-21 — bootstrap — Project foundation

- **Done:** Next.js 16.4 + TypeScript strict + Tailwind 4 skeleton with feature modules (`src/modules/*`) and route groups `(guest)`, `(staff)`, `(admin)`. Theming system (JSON themes → server-rendered CSS variables → Tailwind tokens) with WCAG AA contrast gate and two themes. Base UI: Button, Card, Input, Sheet, Toast; `/dev/theme` showcase. Supabase local stack, Drizzle schema for 10 tables + first migration (RLS enabled on all), deterministic seed (110 invitations, 245 guests). Env loader (Zod, fail fast), logger, security headers, error/404 pages. Vitest + Playwright (mobile + desktop smoke), ESLint (bans colour literals), Prettier, Husky + lint-staged + commitlint, GitHub Actions CI. Agent harness: AGENTS.md + pointers, `.claude/` settings/hooks/commands/agents, `.mcp.json` (Playwright), `docs/tasks.json`, `scripts/agent-loop.sh`.
- **Learned:** Next 16.4 enables Cache Components + Partial Prefetching by default; error boundaries receive `retry` (not `reset`) and `error: unknown`. `next dev` rewrites a managed block at the top of AGENTS.md; keep it. With `"type": "module"`, JSON imports need `with { type: "json" }` for Playwright to load them. pnpm 12 fails installs on unapproved build scripts; approvals live in `pnpm-workspace.yaml` (`allowBuilds`). Supabase CLI now issues `sb_publishable_…` keys.
- **Next:** Run the setup-verification tasks in `docs/tasks.json`, then add the PRD to `docs/prd.md` and break it into tasks.
- **Checks:** pnpm verify ✔
