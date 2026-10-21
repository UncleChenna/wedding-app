---
description: Review the current uncommitted changes (or a commit range) with the reviewer subagents
argument-hint: "[git range, e.g. HEAD~1..HEAD]  (default: uncommitted changes)"
---

Review target: "$ARGUMENTS" (empty means: uncommitted changes)

1. Collect the diff: if a range was given ("$ARGUMENTS"), use `git diff $ARGUMENTS`; otherwise `git diff HEAD` plus `git status --short` for untracked files.
2. Delegate to the `code-reviewer` subagent with the list of changed files.
3. If any changed file is under `src/**/components/`, `src/app/`, `src/app/globals.css`, or `src/modules/theming/`, also delegate to the `ui-reviewer` subagent with the affected routes.
4. Merge the results into one list, ranked: **Blocker** → **Should fix** → **Nit**. Each finding: `file:line` — problem — suggested fix.
5. End with a verdict: `APPROVE` or `CHANGES REQUESTED`.

Do not modify files. This command only reports.
