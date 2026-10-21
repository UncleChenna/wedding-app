---
description: Run the full AGENTS.md loop on one task (plan, failing tests, implement, verify, log, commit)
argument-hint: <task-id from docs/tasks.json, or a short description>
---

Implement exactly one task: **$ARGUMENTS**

Follow the loop in `AGENTS.md` strictly, in order:

1. **Read the task.** If it is a task id, load it from `docs/tasks.json` and set its `status` to `"in_progress"`. If its status is already `"done"`, stop and say so.
2. **Read the relevant docs**: `AGENTS.md`, `docs/architecture.md`, recent `docs/progress.md`, the module's code, and `node_modules/next/dist/docs/` for any Next.js API you use.
3. **Write a short plan** to `docs/plans/<YYYY-MM-DD>-<task-id>.md` (same template as `/plan`).
4. **Write failing tests** that encode the acceptance criteria (use the `test-writer` subagent for anything non-trivial). Run them and confirm they fail for the right reason. If the task is pure verification and the behaviour already exists, write the test anyway and note that it passed first time.
5. **Implement** the smallest change that makes the tests pass. Stay inside the task's module unless the plan says otherwise.
6. Run `pnpm verify:quick`. Fix until green.
7. Run `pnpm verify`. Fix until green. For UI changes, also use the `ui-reviewer` subagent.
8. **Update docs**: append an entry to `docs/progress.md` (format at the top of that file), set the task `status` to `"done"` in `docs/tasks.json`, and update any docs the change affects.
9. **Commit** all changes with one Conventional Commit message, e.g. `test(theming): add overflow check for /dev/theme (SETUP-001)`.

Rules:

- Never mark a task done with failing checks. Never weaken, skip, or delete a test to make it pass.
- Do not push. Do not touch `.env*` secrets.
- If you are blocked (missing decision, paid service, failing check you cannot fix), set the task `status` to `"blocked"`, explain why in `docs/progress.md`, commit the docs change, and stop.

Finish with: task id, final status, files changed, and the `pnpm verify` result.
