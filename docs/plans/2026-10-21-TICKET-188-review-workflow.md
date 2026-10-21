# TICKET-188 — Traceable ticket branches and develop reviews

Implement the user-assigned policy instead of the automatic next suggestion. New claims and worktrees use exact ticket-ID branches; PRs target develop and require task-specific changes, acceptance evidence, verification and risks. Preserve active legacy branches. Protect develop from direct commits/pushes and reserve merging for the human. Test allocation, body checks and hooks, then run full verification. Create missing develop from published main without merging pending work.
