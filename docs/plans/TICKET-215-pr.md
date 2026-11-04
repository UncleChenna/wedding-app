# Ticket

Ticket: TICKET-215

# Summary

Routine base integrations repeatedly required fresh authorization, and PR preparation
repeated already-successful full verification. This change permits unchanged reviewed
artifacts and explicit routine work while retaining protected changes and full CI.

# Changes

- Compare staged regular generated artifacts with fetched develop Git blobs; reject
  changed content, missing refs, unsafe paths, secrets and nonregular artifacts.
- Run the original seven verification steps through a wrapper that removes old evidence
  before each run and records success only with unchanged inputs.
- Reuse matching success for at most one hour in t:pr; `--force-verify` reruns every step.
- Share routine owned-worktree integration and scoped cache recovery rules through
  AGENTS.md and canonical skills, inherited by Claude.

# Acceptance criteria and evidence

Protected-artifact temporary-Git tests and evidence regression tests cover unchanged
versus changed inputs, missing/malformed records, failures, expiry, configuration,
new tests and volatile command identity. Source changes during a run cannot certify
success. Agent links pass. Existing ownership, clean-tree, acceptance and PR-body
checks remain in place. Full final verification runs through the PR command.

# Verification

Initial full gate: 971 unit tests passed, 83 skipped; 795 browser tests passed,
171 skipped. Formatting, lint, types and production build passed. Local log:
`artifacts/TICKET-215/verify.log`. Final verification includes the subsequent volatile
command-ID regression fix. CI remains an independent complete gate.

Database startup failed locally; opt-in database tests and physical devices are not
certified. No product UI or schema changed.

# Risks and rollout

Local evidence is workflow state, not signed proof: never manufacture or edit it.
All tracked/nonignored files, runtime, relevant environment and installed dependency
metadata participate. Database contents and external services are not fingerprinted;
force a rerun after changing them. One-hour expiry bounds reuse. No production
migration is needed. Reverting this ticket restores unconditional PR verification
and repeated exact-path approval for unchanged artifacts.

# Screenshots

Not applicable: no UI changes.

# UI checklist

Not applicable: harness scripts and shared workflow documentation only. Existing
browser coverage was run without weakening assertions.

# Harness changes, if any

Only regular staged pnpm lockfiles, Drizzle SQL/JSON and the generated theme schema
can use the unchanged-develop exception. New protected outputs retain exact-path
approval. Secrets, RLS, production changes, other owners' work and PR merging retain
existing boundaries. CI and every existing full-verification step remain enabled.
