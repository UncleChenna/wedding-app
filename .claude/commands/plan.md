---
description: Write an implementation plan to docs/plans/ before any code is written
argument-hint: <task-id from docs/tasks.json, or a short description>
---

Write a plan for: **$ARGUMENTS**

Do NOT write or change application code in this command. Only create the plan file.

1. If the argument is a task id, read its entry in `docs/tasks.json` (title, module, acceptance criteria). Otherwise treat the argument as the task.
2. Read `AGENTS.md`, `docs/architecture.md`, the last entries of `docs/progress.md`, and the code in the affected module(s). For Next.js APIs, read the matching guide in `node_modules/next/dist/docs/`.
3. Create `docs/plans/<YYYY-MM-DD>-<task-id-or-slug>.md` using exactly this template:

```markdown
# Plan: <title>

- Task: <id or "ad hoc">
- Module(s): <modules>
- Date: <YYYY-MM-DD>

## Goal

<one or two sentences>

## Acceptance criteria

- [ ] <copied from tasks.json or derived>

## Approach

<numbered steps; name each file to create/change>

## Tests first

<the failing unit / e2e tests to write, and what each proves>

## Risks and open questions

<bullets; say "none" if none>
```

4. Keep it under ~60 lines. Prefer boring, documented solutions. Flag anything that needs a paid service, a new account, a schema change, or an RLS change as an open question for the human.
5. Reply with the plan path and a 3-line summary.
