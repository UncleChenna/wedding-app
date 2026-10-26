# Working together

Two developers can run several agents safely when each ticket has one owner, one branch, one managed worktree and one local Supabase stack. Work is tracked in [tickets](tickets.md); claims are synchronized through the `ticket-ledger` Git branch on `origin`; ticket branches are named exactly after their ticket IDs and merge through human-reviewed PRs to `develop`.

If two PRs both add a handoff, resolve the log conflict by retaining both complete entries in newest-first order. Do not drop another session’s evidence.

## First setup (8 commands)

Install Node 24, pnpm 12, Git, Docker, GitHub CLI and your preferred agent first. Docker must be running. macOS, Linux and WSL are supported; Windows skill linking supports directory junctions with copy fallback. Shell workflows on Windows run inside WSL/Git Bash.

```bash
git clone <your-repository-url> wedding
cd wedding
pnpm install --frozen-lockfile
git config harness.owner friend # Divine uses divine; use the same identity in every clone
pnpm agents:link
gh auth login
pnpm db:start
pnpm t:next --module checkin
```

The first Docker image download can take longer than setup itself. Do not add a second agent to an existing editing session's checkout. The primary checkout is for coordination; product edits happen inside managed worktrees.

## Ownership

| Module                 | Primary owner | Review              |
| ---------------------- | ------------- | ------------------- |
| invitations, theming   | Divine (me)   | Friend              |
| checkin, ordering      | Friend        | Divine              |
| admin, shared, harness | Either        | The other developer |

`harness.owner` is a local Git setting, not a GitHub login or authorization boundary. Replace `.github/CODEOWNERS` placeholders with real handles. GitHub does not let an author approve their own PR, so one approving CODEOWNERS review covers shared work after protection is enabled. Agree cross-module changes before overlapping work.

## Claim and start

```bash
pnpm t:next --module checkin
pnpm t:claim TICKET-003 --owner friend --agent claude
pnpm wt:new TICKET-003
cd .worktrees/TICKET-003
pnpm t:move TICKET-003 in_progress --push
claude # or codex, or open this directory in Cursor
```

Use a ticket appropriate to your module; the example ID is illustrative. Ask the agent to use `ticket-workflow` and `implement-task`. Claude exposes `/ticket-workflow`; Codex exposes `$ticket-workflow`; Cursor discovers the skill in its skill picker. Run the agent in this directory without another automatic worktree flag.

A claim writes a metadata-only commit to `origin/ticket-ledger` with a compare-and-swap push. It does not stage your working tree, and concurrent claims cannot both win. Missing network/remote fails closed for changes; reads fall back to committed files with a warning. `TICKETS_LEDGER=off` is only for a solo offline session and does not coordinate two developers. Ticket fields, statuses, allowed transitions and the ledger are documented in [tickets.md](tickets.md). A blocked ticket keeps its owner (`pnpm t:move <id> blocked --reason …`). Release a claimed `todo` ticket deliberately with `pnpm t:release <id>`; only its owner may release. Never silently steal stale claims: coordinate with the other developer first.

`wt:new` creates `.worktrees/<id>` on `<owner>/<id>-<title-slug>`, installs locked dependencies, refreshes skill links, copies `.env.local` without printing it, replaces database/API/site settings with isolated local values, starts Supabase and applies migrations. Rerunning resumes incomplete setup. Run `pnpm db:seed` if sample data is needed. Keep database environment variables out of your shell so they cannot override worktree settings.

Each worktree reserves a block of 20 available ports and a unique Supabase project ID. `.harness/worktree.json` records the app/browser ports and identity; `.harness/supabase-project/supabase/config.toml` is generated from the committed template. `pnpm dev`, `pnpm start`, Playwright and database wrappers use this identity. `pnpm db:reset` explicitly selects the local stack and refuses mismatched database URLs. Never call raw `supabase db reset` in a worktree.

The reservation is locked across worktrees in one clone; live port checks also avoid other clones. Another process can still take a port after allocation; startup fails visibly rather than borrowing a running stack. Stop that process or remove/recreate the unused worktree. Full stacks cost more Docker memory but isolate Auth/Realtime as well as rows.

## PR flow and cleanup

1. Follow `ticket-workflow` and `implement-task`, including the full gate and UI checklist where applicable. Every commit subject starts `TICKET-NNN: `; no AI attribution.
2. Tick the acceptance criteria you proved and add notes to the ticket. Write or update `docs/handoffs/<ticket-id>.md`; never append to the shared historical `docs/progress.md`. Commit ticket changes only.
3. Copy `.github/pull_request_template.md` to `docs/plans/<ticket-id>-pr.md`, fill in evidence and commit it.
4. Run `pnpm t:pr <id>` inside the worktree. It independently verifies, pushes the branch, opens/reuses a detailed PR targeting `develop`, titled `<id>: <title>` and moves the ticket to `in_review`. It requires `gh` and an authenticated `origin`.
5. The human reviews; CI must pass. Only the human merges via GitHub, then `pnpm t:move <id> done` verifies the merged PR and records completion in the ledger. The ticket file catches up on your next ticket branch.
6. From the primary checkout, run `pnpm wt:remove <id>`. It refuses dirty or unmerged work, stops only that stack, deletes its disposable database volumes, and removes the checkout. The Git branch remains for recovery. Removal is explicit authorization to delete that worktree's disposable data; back up anything valuable first.

`wt:list` lists Git checkouts; `wt:prune` removes stale Git metadata only, never data. A failed setup leaves a reservation and checkout for retry; use `wt:remove` for cleanup. If a harness process crashes while holding `.git/harness-*.lock`, confirm no process is active before manually removing that lock directory. No automatic expiry can evict a live agent's lock.

## Shared versus personal

Shared: `AGENTS.md`, nested source rules, `.agents/skills`, agent adapters, reviewer definitions, hook code, tickets, docs, CI and plugin source. Personal: Git identity/`harness.owner`, agent login/API keys, `.env.local`, `.claude/settings.local.json`, `CLAUDE.local.md`, and user-level `~/.codex/config.toml` / `~/.cursor/` preferences.

Codex uses a shared `.codex/hooks.json`; its `.codex/config.local.toml` and `*.local.json` ignore entries are storage conventions only, not automatically loaded Codex layers. Cursor likewise does not automatically load arbitrary `*.local.json`; use its user settings. Do not commit personal settings or credentials. Hooks require the agent's normal trust review; restart/reload the agent after linking if skills are absent.

## Skills and hooks

Author each portable skill at `.agents/skills/<name>/SKILL.md` with YAML `name` and a precise “use when” `description`. Keep procedures short; put long references inside the skill. Canonical design rules remain in `docs/`, not copied into every skill. Run `pnpm agents:link`, `pnpm agents:check`, and `pnpm plugin:build` after changes. `agents:link --copy` exercises the Windows fallback; copied skills refresh on every link run. Codex and Cursor read `.agents/skills` directly, so no duplicate discovery path is created for them.

Shared pre-tool hooks allow non-secret reads outside the checkout, resolve symlink targets, and confine edits to the checkout. Secret environment-file reads remain blocked (`.env.example` is allowed). Common shell commands and redirects are inspected by their read/write operands, so mentioning a protected path in quoted data or a read-only pipeline does not imply a write. Dynamic write targets must use an explicit path. This is static inspection, not a complete shell interpreter; arbitrary programs still rely on post-tool/staged checks and platform permissions.

Shared pre-tool hooks reject direct protected-file edits and obvious shell writes; post-tool hooks format/lint changed editable files. Stop hooks require `verify:quick` with no failure-count escape. Cursor uses uncapped follow-ups. Husky blocks main/develop commits and direct pushes, validates protected staged files, runs lint-staged and the quick gate. CI remains the full merge gate. Hooks cannot prevent a user killing a process, disabling local hooks, or arbitrary external programs changing files; they are workflow enforcement, not an OS security boundary. Sandbox permissions and GitHub protection remain necessary.

For an explicitly requested protected-file change, the human creates ignored `.harness/approved-writes.json` with exact paths, a reason, and a future ISO `expires_at`:

```json
{
  "paths": ["pnpm-lock.yaml"],
  "reason": "Approved dependency update for TASK-ID",
  "expires_at": "2026-10-22T18:00:00Z"
}
```

Agents must not fabricate this authorization. Use package/schema generators even after approval; never hand-edit an applied migration. Secret environment files are never commit-eligible. Database bootstrap is an expressly authorized script operation that copies/rewrites local values without displaying secrets; it is not permission to inspect them.

## Claude plugin (optional)

The repository works without installing a plugin. For a friend who wants the packaged skills, reviewers and hooks, run **`pnpm plugin:install`** in the clone. It builds `tooling/plugin/dist`, validates it, adds the local `wedding-team` marketplace, and installs `wedding-harness@wedding-team` with local scope. No AI API request is made by installation. Restart Claude and inspect `/plugin`; plugin skills use `/wedding-harness:implement-task` etc. Plugin hooks avoid double-running when the repository hooks are present.

To share a package, run `pnpm plugin:build` and distribute the entire `tooling/plugin/` folder including `dist/` and its marketplace manifest. Generated copies are not edited or committed. Codex and Cursor need no Claude plugin: open the clone and run `pnpm agents:link`. The plugin is intended for this repository and its docs/scripts, not arbitrary projects.

## Owner actions before collaborating

- Configure the real GitHub `origin` remote and push the harness branch for review. This checkout originally had no remote.
- Replace `@REPLACE_ME_DIVINE` and `@REPLACE_ME_FRIEND` in CODEOWNERS with collaborator handles with write access.
- Run `bash scripts/setup-branch-protection.sh [owner/repo]` yourself after required CI checks have run. It enforces up-to-date passing verify/database checks, one approving CODEOWNERS review, stale-review dismissal, no force pushes/deletion, and applies to admins. It is never run automatically. Availability depends on repository visibility and GitHub plan.
- Optional AI review stays disabled. Only after approving API costs, add repository secret **`OPENAI_API_KEY`**, then repository variable **`ENABLE_AI_REVIEW=true`**. It uses official `openai/codex-action@v1`, only on same-repository PRs, with read-only permissions; output goes to the job summary. No paid account or key is created here.
- Trust project hooks in each agent. Confirm a protected edit and a failing stop are blocked before relying on a newly installed agent version.

## Repeated mistakes and handoffs

After the same mistake twice, propose one specific improvement to a hook, skill or doc line in the session summary. Apply an approved fix at its canonical source and add a one-line verified lesson to `docs/learnings.md`. Do not multiply agent-specific copies of the rule. Preserve incomplete work, state failed/unrun checks, and give the next agent an exact next command.

See [the verified tool-format sources](agent-tooling-sources.md) and [ADRs](decisions/README.md) for rationale and compatibility limits.

## Agent hooks and GUI PATH

Hooks first use pnpm from their inherited PATH. If a GUI launch omits its installation
folder, they also check the running Node directory, PNPM_HOME, ~/.npm-global/bin,
~/.local/share/pnpm and ~/Library/pnpm. The selected pnpm directory and running Node
directory are passed to child commands so verification can launch nested scripts.
No package manager is downloaded automatically, and failing checks still block.

For another installation location, put it on the agent process's PATH or set
PNPM_HOME before launching the editor/agent. Restart after changing its environment.
A shell export inside an agent command cannot modify the parent hook's environment.
The hook launcher itself still requires node and git. Run agents in the ticket
worktree containing the repair, or pull it after human review and merge; an older
checkout continues using its own older hook code.
