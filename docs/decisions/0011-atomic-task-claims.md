# 0011 — Git remote compare-and-swap claims

- Status: Accepted · 2026-10-21

**Context.** Editing tasks.json independently in two clones cannot prevent both developers claiming the same task. A filesystem lock only coordinates one clone.

**Decision.** Use `origin/agent-tasks` as a coordination ledger. Build a metadata-only commit with a temporary Git index, parented to the observed ledger SHA. Push with an exact SHA lease on that single ref. Concurrent updates fail atomically; nothing is auto-overwritten. Normal task branch pushes never use force. Local lock directories serialize operations within a clone. Explicit `--local` exists for tests only.

**Consequences.** Claims require network and push access; missing origin fails closed. The coordination branch is not merged into main. Definitions live on main; task commands overlay live status/owner metadata. Claim commits do not stage or commit working-tree changes. `in_review` follows PR creation, `done` requires a merged PR verified by gh. Blocked work retains ownership; handoffs explain it. Task snapshots can be refreshed with task:sync. Protect main separately; do not require PRs on the coordination branch.
