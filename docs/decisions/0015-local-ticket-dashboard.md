# ADR 0015: Local ticket views and isolated handoffs

Status: proposed for human review in TICKET-189.

Repeated merges conflicted because every ticket rewrote generated BOARD/ROADMAP files and prepended to the same progress log. Starting branches at an arbitrary feature HEAD also carried unrelated changes forward.

Generate a standalone read-only HTML dashboard and optional Markdown snapshots under ignored `artifacts/tickets/`. The ticket files provide definitions; the atomic shared ledger provides current status/ownership. Label snapshots with time, local develop reference, and explicit offline fallback. Browser content uses text nodes and safely escaped embedded JSON; only HTTPS GitHub PR URLs become links. No server, external assets, new service or product route is required.

Keep tracked BOARD/ROADMAP files as stable entry points. Derive reverse dependencies in memory from `blocked_by`. Do not copy other tickets' completion records into feature branches. Sync/push only the assigned ticket; claim/move remain the live dependency-readiness gate. Static validation still checks definitions, graph edges/cycles and each file's internal status consistency, but does not infer live prerequisite completion from stale committed metadata.

Write one handoff file per ticket, preserving the historical progress log. New managed branches fetch origin/develop; existing branches remain intact. A new ticket definition absent from develop is copied alone into its new worktree, rather than inheriting its source branch's implementation.

A hosted dashboard and write endpoints were rejected for this iteration because they introduce authentication/deployment/mutation concerns without solving shared-file conflicts. The standalone page requires regeneration to refresh. Merged PRs still need the existing CLI completion step; this is not GitHub status reconciliation. New tickets absent from the selected checkout are not visible until their definitions arrive.

Rollout: merge this PR, update older branches once, keep stable board entry points, move their new handoff entries into their own files and regenerate local views. Older CLI versions can still rewrite boards, so both developers and agents must update before starting more work. Conflicts in genuinely shared implementation files remain possible. Rollback reverts this ticket's implementation; no database or ledger-format migration is involved, and per-ticket handoff history should be preserved.
