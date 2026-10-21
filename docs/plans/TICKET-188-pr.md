# Ticket

Ticket: TICKET-188 — Require ticket-named branches and detailed develop PRs

# Summary

New work previously used owner-prefixed branches and the CLI opened PRs into main. New claims now use the exact ticket ID (for example TICKET-188), and PRs target develop for human review and merge. Every handoff must have pushed work and a linked PR; unfinished work uses a draft. Agents must not merge, enable auto-merge or push directly to integration branches.

Integration context: develop has been initialized from published main, without merging pending work. This branch includes the existing ticket-system foundation and the preceding audit (#2), prefix migration (#4), and pre-coding rule (#5). Those remain separately tracked work, not additional implementation hidden in this ticket. Review/integrate those prerequisites first; the changes specific to TICKET-188 start after commit 2a187a9. No existing PR was merged or retargeted by this task.

# Changes

- New claims and managed branch naming use the exact ID, with no owner prefix or descriptive suffix.
- Ticket PRs default to develop; completion checks require a merged develop PR, and cleanup checks develop ancestry.
- PR bodies require substantive Summary, Changes, Acceptance criteria and evidence, Verification, and Risks and rollout sections; existing PR bodies refresh on resubmission.
- Hooks and ticket file-write guards protect develop as well as main. Existing active branch names and stable claim keys remain compatible.
- AGENTS.md, portable workflow skills, collaboration docs and the PR template describe one-ticket/one-branch/one-PR tracking and human-only merging.

# Acceptance criteria and evidence

- Exact ticket-ID branch allocation: shared-remote CLI regression asserts the branch stored by a new claim is TICKET-001; branch-name helper test asserts the same convention.
- Develop PRs and detailed bodies: review-contract tests cover the develop default, empty/comment-only templates, complete bodies and missing evidence sections. PR creation and completion use this base.
- Human review and pushed work: canonical shared instructions require pushed progress, linked PRs, no automatic merging and no direct integration-branch edits. The develop pre-push regression rejects a direct push.
- Validation: the full gate passes, including all ticket definitions and the existing cross-clone claim race.

# Verification

Full pnpm verify passed using documented public local environment defaults and isolated PW_PORT=3196: formatting, lint, type checking, 77 unit tests, production build and 17 browser smoke passes, with 7 pre-existing skips. Focused harness/ticket/review/hook tests passed (35 tests). New branch assertions failed before implementation. No product UI changed, so screenshots are not applicable. Actual human review and merging remain pending; repository-hosted branch protection was not changed.

# Risks and rollout

This PR contains unmerged prerequisite history described above because develop starts at published main. Review the preceding work before integrating this branch. Existing workers retain their branch names; only new claims use exact-ID branches. Future merges must target develop, and existing PRs targeting a different branch require an explicit retarget before the new CLI will accept review/completion. Local hooks are safeguards, not GitHub branch protection. There are no database migrations or new services. Roll back the workflow change by reverting its ticket commits through a reviewed PR; do not delete the shared claim ledger or rewrite active branches.
