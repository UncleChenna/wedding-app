---
id: TICKET-208
title: Copy Supabase auth templates into managed worktrees
epic: foundations
status: in_progress
priority: high
estimate: S
labels: [infra, test]
module: harness
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-208
pr: ""
created: 2026-10-31
updated: 2026-10-31
started: 2026-10-31
completed: ""
reason: ""
resume_to: ""
---

# TICKET-208: Copy Supabase auth templates into managed worktrees

## Context

Managed worktree setup copies supabase/config.toml but omits its referenced auth email templates. Fresh TICKET-047 and TICKET-103 stacks failed with StartInvalidConfigError for supabase/templates/admin-code.html. Copying that unchanged repository template into the isolated stack fixed startup. See [collaboration setup](../docs/collaboration.md).

## Scope

- Include tracked auth email templates in each managed isolated Supabase setup before db:start.
- Keep template bytes unchanged and make repeated setup safe.
- Reject unsafe template paths/symlinks rather than reading arbitrary files outside the checkout.

## Out of scope

- Credentials, template wording, auth policies, migrations, CI and stack deletion.
- Other hook-parser defects require separate tickets.

## Acceptance criteria

- [ ] Isolated setup includes the committed admin-code.html referenced by the generated configuration before db:start.
- [ ] Template content is unchanged, and repeated setup refreshes source changes without touching unrelated files.
- [ ] Unsafe symlinks/path escapes are rejected by regression tests.
- [ ] Focused harness tests and pnpm verify pass; setup evidence confirms Supabase can read its configured template.

## Test plan

- Unit: fresh temporary setup, byte equality, repeat setup and unsafe link/path handling.
- Integration: run isolated Supabase setup using the copied configuration/templates, preserving data.
- Gate: pnpm verify.

## Files likely touched

- scripts/worktree.mjs
- scripts/harness/
- scripts/__tests__/harness.test.ts

## Notes / decisions

- 2026-10-31: Reproduced in two new worktrees. No credential or database-policy change is needed.

## Activity log

- 2026-10-31 — new → backlog — divine
- 2026-10-31 — backlog → todo — divine (codex)
- 2026-10-31 — todo → claimed — divine (codex)
- 2026-10-31 — todo → in_progress — divine (codex)
