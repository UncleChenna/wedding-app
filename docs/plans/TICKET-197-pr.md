# Ticket

TICKET-197

# Summary

Agent post/stop hooks failed with spawnSync pnpm ENOENT when a GUI launch omitted the user's pnpm directory from PATH. Hooks now resolve an existing installation and pass both pnpm and the running Node directory to verification subprocesses.

# Changes

Inherited PATH retains priority. Fallback lookup checks PNPM_HOME, the current Node directory and standard user npm/pnpm locations. No shell startup, installation or network download is used. Missing installations produce actionable guidance; nonzero verification still blocks completion. The shared hook implementation covers Codex, Claude and Cursor without changing their adapters or disabling checks.

The failed initial ticket allocation consumed 196 before reporting missing owner identity. Its record is cancelled through the CLI; 197 owns implementation. Existing 194/195 definitions are carried unchanged from TICKET-106 because validation requires contiguous ids. TICKET-194 already tracks the allocation bug; no implementation from that ticket is included.

# Acceptance criteria and evidence

Five new regressions cover npm-home fallback, inherited PATH precedence, PNPM_HOME, missing executables, nested Node lookup and real stop-hook success/failure under minimal PATH. The original red run failed because the resolver did not exist. Existing hook tests still prove repeated verification failures cannot bypass the gate. A manual check with PATH=/usr/bin:/bin resolved the user's installed pnpm and printed version 12.14.0.

# Verification

Quick and full verification pass: 223 unit tests, production build, 86 browser passes and 12 existing conditional skips. Full-gate evidence is recorded in the ticket handoff. No guest UI changes or real editor relaunch was tested; resolver and hook subprocess behavior are tested directly. Windows native shell behavior was not exercised; existing Windows pnpm.cmd handling is retained.

# Risks and rollout

Requires an existing pnpm installation and a hook launcher that can already find node/git. Other installation locations must be supplied through PATH or PNPM_HOME. Hooks remain local to each checkout: open the TICKET-197 worktree for review, or pull develop after human merge and relaunch the agent there. An older primary checkout keeps using its older hook code. No dependencies, CI, secrets or global environment changes. Revert this ticket's hook import/helper to roll back; verification remains mandatory.

# Screenshots

N/A: tooling only, no rendered interface changes.

# UI checklist

N/A: no application UI, theme, motion, QR or guest flow changes.

# Harness changes, if any

Add a shared pnpm resolver called by the existing hook command runner, installation recovery documentation, and regression tests. Preserve all existing protection and verification rules.
