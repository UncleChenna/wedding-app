# Progress log

Add-only history, newest first: prepend new entries below this template, never rewrite old entries. Legacy entries below retain their original wording; authors/agents were not recorded at the time.

```markdown
## 2026-10-26 — TICKET-191 — Quantity stepper keyboard fix

- **Changed:** Preserve typed quantities and focus at bounds; forward input props.
- **Checks:** Quick/full gates pass (235 unit tests, 95 browser passes, 13 conditional skips). See docs/handoffs/TICKET-191.md and docs/reviews/TICKET-191/. TICKET-015 remains paused.

## 2026-10-26 — TICKET-197 — Hook pnpm lookup

- **Changed:** Added existing-installation lookup for minimal GUI PATH; verification failures remain blocking.
- **Evidence / next:** See docs/handoffs/TICKET-197.md for checks and review status. Human merge only.

## YYYY-MM-DD HH:mm UTC — TASK-ID — Title

- **Who / agent / branch:** owner · agent · branch
- **Changed:** files and resulting behaviour
- **Checks:** commands actually run, results, and unverified checks
- **Learned:** project-specific facts or repeated-mistake harness fix
- **Next / blockers:** exact next action, ownership and outstanding prerequisites
```

---

## 2026-10-21 — TICKET-102 — Resolve conflicts after PR #9

- **Who / agent / branch:** divine · codex · `TICKET-102`.
- **Changed:** Integrated develop at cb365fe after PR #9 merged, preserved both progress histories and merged prerequisite fixes, and regenerated ticket boards. Ticket implementation remains unchanged.
- **Checks:** Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.
- **Learned:** Shared handoff entries and generated boards require reconciliation when parallel ticket PRs integrate.
- **Next:** Human review of this ticket PR into develop; no PR merged automatically.

## 2026-10-21 — TICKET-102 — Resolve develop conflicts

- **Who / agent / branch:** divine · codex · `TICKET-102`.
- **Changed:** Integrated develop, preserved both progress histories and merged prerequisite fixes, and regenerated ticket boards. Ticket implementation remains unchanged.
- **Checks:** Quick and full verification passed: 106 unit tests, production build, 17 browser smoke passes and 7 existing skips.
- **Learned:** Shared handoff entries and generated boards require reconciliation when parallel ticket PRs integrate.
- **Next:** Human review of this ticket PR into develop; no PR merged automatically.

## 2026-10-21 — TICKET-102 — Service-worker decision

- **Who / agent / branch:** divine · codex · `TICKET-102`.
- **Changed:** Proposed ADR 0014 and disposable `spikes/pwa` build/browser experiment. Custom allowlisted worker selected for review; no production worker or dependencies added.
- **Checks:** Two production builds; Chromium registration, precache, runtime fallback, offline reload and cache inspection passed. Worker 1,494 bytes (643 gzip); static output unchanged. Quick and full gates passed: 104 unit tests, build, 17 smoke passes, 7 existing skips.
- **Learned:** Serwist has a Turbopack integration, but its convenience policies still require privacy/update review. Build timings are warm-cache observations, not a speed benchmark.
- **Next:** Human reviews ADR and PR into develop. TICKET-105 implements root-scope policy; private data, upgrades and real iOS tests remain downstream.

## 2026-10-21 — TICKET-009 — Resolve develop conflicts

- **Who / agent / branch:** divine · codex · `TICKET-009`.
- **Changed:** Integrated develop, preserved both progress histories and merged prerequisite fixes, and regenerated ticket boards. Ticket implementation remains unchanged.
- **Checks:** Quick and full verification passed: 108 unit tests, production build, 17 browser smoke passes and 7 existing skips.
- **Learned:** Shared handoff entries and generated boards require reconciliation when parallel ticket PRs integrate.
- **Next:** Human review of this ticket PR into develop; no PR merged automatically.

## 2026-10-21 — TICKET-009 — Contrast gate evidence

- **Who / agent / branch:** divine · codex · `TICKET-009`.
- **Changed:** Theme loader regression coverage now verifies every failing pair and registry-import rejection; theming guide clarifies import/registration checks. Shipped themes are unchanged.
- **Checks:** Temporary third theme passed the documented command; invalid foreground failed with its identity. Quick gate and full verify passed: 106 unit tests, build, 17 browser passes, 7 existing skips. UI review N/A: tests and docs only.
- **Learned:** Existing loader already enforces this contract; additional production code is unnecessary.
- **Next:** Human reviews the PR into develop; dependent tickets wait for merge.

## 2026-10-21 — TICKET-002 — Resolve develop conflicts

- **Who / agent / branch:** divine · codex · `TICKET-002`.
- **Changed:** Merged `develop` into the ticket branch after TICKET-001 merged. Preserved both hook implementations and regression suites, both historical handoffs, and CLI-synced TICKET-001 completion; regenerated boards and refreshed the PR description.
- **Checks:** `pnpm verify:quick` passed (58 related tests). Full `pnpm verify` passed using public local defaults: 188 valid tickets, formatting, lint, types, 106 unit tests, production build, 17 smoke passes and 7 existing skips.
- **Learned:** Conflicts were in shared progress and ticket metadata; the complementary hook changes merged cleanly and passed together.
- **Next / blockers:** Review PR #8 and merge into `develop` when approved. Interactive Claude integration remains unverified.

## 2026-10-21 — TICKET-002 — Safe reads and shell write targets

- **Who / agent / branch:** divine · codex · `TICKET-002`.
- **Changed:** `scripts/harness/hooks.mjs`, `core.mjs`, new `shell-access.mjs`, regression tests and collaboration documentation. Non-secret temporary files can be read; writes remain confined to the checkout. Common shell commands check actual operands and redirections, including symlink-resolved secret reads and protected directory destinations.
- **Checks:** Regression run before implementation: 12 failed, 21 passed. Focused hooks/harness suite: 39 passed. Full `pnpm verify` using public `.env.example` defaults: 104 unit tests, production build, 17 smoke passes and 7 existing skips. No product UI changed. Interactive Claude runtime integration was not exercised.
- **Learned:** Directory operands such as `cp -t drizzle x` require protection of the directory itself, not just descendant paths. Static command inspection is not a complete shell interpreter or security sandbox.
- **Next / blockers:** Human review and merge of the `TICKET-002` PR into `develop`. Earlier harness/backlog workflow changes remain unmerged prerequisites visible in its history. TICKET-001's separate post-hook fix remains owned by its existing reviewer; this work does not duplicate it.

## 2026-10-21 10:45 UTC — TICKET-001 — Hooks skip the symlinked .claude/skills

- **Who / agent / branch:** unclechenna · claude · `TICKET-001`
- **Changed:** Ported PR #3 (`WED-001`, closed as superseded) onto develop as PR #7. The post-tool formatter skips non-regular files, so the `.claude/skills` symlink no longer raises a PostToolUse error. `agents:check` rejects a committed `.claude/skills`. `isolatedGitEnv()` sandboxes every git-spawning test.
- **Checks:** The regression test fails on the old hook and passes with the fix. `agents:check` exits 0 in a fresh clone and 1 with the link committed. Full `pnpm verify` with public local defaults passed: 79 unit tests, build, 17 smoke.
- **Learned:** `wt:new` reuses the ledger's recorded branch, so a ticket claimed before the exact-ID rule cannot get a `TICKET-NNN` worktree through it; this one was created with `git worktree add` and has no local env file. The Bash guard also blocks heredocs whose text merely mentions protected paths (TICKET-002 scope).
- **Next / blockers:** Human review of PR #7. After merge: `pnpm t:move TICKET-001 done`, `pnpm wt:remove WED-001`, delete the old `unclechenna/WED-001-…` branch, and remove `.worktrees/TICKET-001`.

## 2026-10-21 10:03 UTC — TICKET-188 — Exact ticket branches and develop reviews

- **Branch:** `TICKET-188`.
- **Changed:** New ticket claims use exact ID branches; PR creation targets develop and rejects incomplete review sections. Existing PR descriptions refresh from their task body. Shared rules require pushed progress, a PR for every handoff, task-specific evidence and human-only merging; no auto-merge. Hooks block direct develop commits/pushes, and merged-ticket/worktree cleanup checks use develop.
- **Checks:** Failing branch-allocation tests confirmed the old behavior; 35 focused tests then passed. Full `pnpm verify` with public local defaults passed: 77 unit tests, build, 17 smoke passes and 7 existing skips. Ticket validation and formatting pass.
- **Next / integration:** develop was created from published main only. Existing harness/backlog/prefix/preflight branches remain unmerged and are prerequisites visible in the PR history. The human decides their integration; no remote PR was merged. Existing active branch names remain compatible during rollout.

## 2026-10-21 09:56 UTC — TICKET-187 — Mandatory backlog alignment before coding

- **Branch:** `divine/TICKET-187-backlog-preflight`.
- **Changed:** AGENTS.md now requires live board/next, roadmap, intended ticket, blockers, PRD and recent handoff review before coding. Agents confirm scope/ownership/readiness, state outcome and verification, and recheck after scope changes. Both workflow skills link to this canonical rule; Claude and other integrations inherit it.
- **Checks:** Formatting and ticket validation pass. Full `pnpm verify` with public local defaults passed: 73 unit tests, build, 17 smoke passes and 7 existing skips. Shared-instruction imports and links inspected.
- **Next:** Review the stacked instruction PR; expose the same verified commit in the clean original IDE checkout. No product code changes.

## 2026-10-21 09:41 UTC — TICKET-186 — Rename ticket prefix

- **Branch:** `divine/TICKET-186-ticket-prefix`.
- **Changed:** Renamed all 186 ticket files and canonical IDs to TICKET, including references, boards, parsers, allocation, commit rules, shared instructions and Claude-facing workflow docs. Legacy CLI arguments and existing branches remain supported; stable internal ledger keys prevent duplicate claims across old/new worktrees.
- **Checks:** `pnpm verify` passed with documented public local defaults: 73 unit tests, build, 17 smoke passes and 7 existing skips. Initial prefix regression failed as expected before implementation. Live old/new ID lookups return the same existing owner's claim. All 186 files validate; no WED-prefixed filenames remain.
- **Learned:** Prefix length was embedded in numeric ID parsing; changing filenames alone would break ordering and shared claims. Ledger storage keys must remain stable while older worktrees exist.
- **Next:** Review the rename PR stacked on `divine/HARNESS-002-backlog-audit`. Other active worktrees and remote branch names were not renamed; update them after merging the naming migration. No product UI changed.

## 2026-10-21 09:28 UTC — HARNESS-002 — Independent backlog audit

- **Branch:** `divine/HARNESS-002-backlog-audit`, based on the current `chore/ticket-system` tree.
- **Changed:** Audited all 168 source tickets against PRD/current-state/roadmap and committed SPIKE-001 findings. Added 17 tickets with the CLI, revised 136 originals, split overloaded work, prioritized early invitation sending, and wrote 36 numbered plus 51 supplementary traceability rows in `tickets/AUDIT.md`. Added a narrow AUDIT.md validator exception with regression coverage. Product code and ticket statuses are unchanged.
- **Checks:** Full `pnpm verify` passed using documented public local environment defaults: 69 unit tests, build, 17 smoke passes and 7 existing skips. Ticket-specific suite: 19 passes. Final render/validate and format checks pass; simulation reaches all 182 todo tickets with no cycles or stranded work. Earlier smoke attempts lacked environment configuration and were not counted as passing.
- **Learned:** Dependency order alone did not prioritize the invitation milestone; priority changes were also necessary. Offline revocation cannot be immediate on a disconnected device. A backup drill must verify media and configuration as well as database rows.
- **Next / blockers:** Review `tickets/AUDIT.md` and the stacked PR against `chore/ticket-system`; its previous PR #1 is closed and main does not yet contain the ticket system. Human decisions WED-034 (Wallet/date/limits) and WED-169 (QR authority/offline freshness) remain open. No feature implementation, real-device approval or production recovery is claimed.

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
