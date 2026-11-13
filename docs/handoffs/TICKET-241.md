# TICKET-241 handoff

Claimed from develop 97e67cd2 in its own worktree. TICKET-124 could not start ahead of unstarted TICKET-149, so local implementation is split here with completed TICKET-033/059/105 prerequisites. Every deployment acceptance criterion remains in TICKET-124, with TICKET-241 added as a prerequisite.

Draft PR #199 contains the initial exact-origin validation implementation at a7ec62e4. All 13 policy tests and the initial quick gate (20 related tests, lint and types) pass. The subsequent actual browser audit found `script-src:eval` from Zod's caught optional evaluation probe in a compiled Next chunk.

The final local repair initializes named-mini `config({ jitless: true })` before both Next and standalone scanner modules. Its production build and six browser cases pass in 7.0 seconds; independent policy and startup reviews are clean. Existing policies and negative-script assertions remain unchanged. The standalone test mounts an expired synthetic shell, proving startup compatibility without claiming authenticated admissions or physical camera operation.

After publishing the final repair through t:pr, monitor required hosted CI before merging. The commit hook itself runs quick verification; avoid launching a redundant check alongside it. No database was started. TICKET-124 retains all HTTPS staging, production grade-A and post-release evidence.
