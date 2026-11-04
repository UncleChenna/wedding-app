---
id: TICKET-215
title: Streamline routine agent approvals and reuse verified source checks
epic: foundations
status: in_progress
priority: urgent
estimate: L
labels: [infra, test, docs]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-215
pr: ""
created: 2026-11-04
updated: 2026-11-04
started: 2026-11-04
completed: ""
reason: ""
resume_to: ""
---

# TICKET-215: Streamline routine agent approvals and reuse verified source checks

## Context

The owner requested fewer repetitive security/approval interruptions while retaining
clean, traceable work. Follow [collaboration](../docs/collaboration.md) and the
[agent workflow](../.agents/skills/ticket-workflow/SKILL.md). TICKET-185 repeatedly
needed authorization for generated files and repeated full verification; TICKET-032
needed an explicit base update. TICKET-214 already addresses reserved ticket IDs
and ahead-of-dependency work; do not duplicate it.

## Scope

- Authorize routine reversible work inside the owned ticket worktree in shared agent
  instructions, including approved base integration and scoped disposable cache cleanup.
- Accept staged protected artifacts that are byte-identical to verified develop
  content without another approval record; keep secrets and changed artifacts protected.
- Record successful verification against a source/config/dependency fingerprint;
  let the PR workflow reuse only matching successful evidence, with an explicit force-rerun.
- Keep Claude and Codex on the same canonical rules, with regression tests for the
  allowed cases and the cases that must still fail closed.

## Out of scope

- Application authentication, guest privacy, rate-limit budgets and RLS weakening.
- Production migrations, data deletion, paid services or secrets authorization.
- Automatic merges without explicit user authorization; tests/CI bypasses.
- TICKET-214's reserved-ID and dependency changes; TICKET-213's database hosting work.

## Acceptance criteria

- [x] Unchanged staged lockfiles/generated files matching verified develop are accepted; modified files, secrets, invalid refs and unsafe paths still refuse without appropriate authorization.
- [x] Shared instructions permit routine reversible owned-worktree actions without repeated permission; production/destructive actions, secrets and unrelated owners' work remain explicit boundaries.
- [x] A successful verification record is reusable only for matching source/config/dependency inputs and supported runtime; changed or new source/tests/config invalidate it, and missing/failed/malformed evidence forces full verification.
- [x] The PR command reports whether verification was run or reused, offers a force-rerun, and never interprets skipped/unverified checks as passes.
- [x] Claude inherits the same canonical policy; relevant hook/workflow tests, agent-link checks and full verification pass.

## Test plan

- Unit/integration: real temporary Git repositories for protected-file comparisons;
  unchanged/changed/new files, secrets, missing refs and path traversal.
- Verification: passing and failing command runners; fingerprint invalidation for
  tracked/untracked source, tests, configuration, dependency lockfiles and runtime changes.
- Workflow: PR review still requires criteria, clean/pushed work and valid evidence;
  stale or fabricated-shaped records cannot bypass normal verification.
- Manual: inspect Claude's canonical imports; verify the shared documentation has no
  blanket production permission or failing-check escape hatch.

## Files likely touched

- scripts/harness/hooks.mjs and protected-file helpers/tests
- scripts/tickets.ts and verification helpers/tests
- package.json verification entry point, AGENTS.md, docs/collaboration.md
- .agents/skills/ticket-workflow/SKILL.md and implement-task/SKILL.md

## Notes / decisions

- 2026-11-04 — Requested by owner; defined separately from product-security tickets.
  TICKET-214 is another collaborator's active work and must be preserved.

## Activity log

- 2026-11-04 — new → todo — divine
- 2026-11-04 — todo → claimed — divine (codex)
- 2026-11-04 — todo → in_progress — divine (codex)

- 2026-11-04 — Initial full gate passed (971 unit / 795 browser; 83 / 171 skipped). Added command-identity regression before final PR gate. Database startup unavailable; no database or physical QA claim.
