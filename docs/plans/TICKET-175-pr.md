# Ticket

TICKET-175 — Validate and store invitation photo uploads. Target develop.

# Summary

Prepare the isolated implementation of admin-only photo uploads. The finished
pipeline must decode and validate real image bytes, strip metadata, correct
orientation and return a controlled asset reference with dimensions and blur data.
This draft currently contains the implementation plan and dependency proposal only.

# Changes

- Claimed ticket and initialized its isolated managed database/worktree.
- Defined proposed format, byte, pixel and output bounds and fixture test coverage.
- Proposed direct sharp0.35.5 dependency, already loaded transitively through Next;
  explicit native-dependency and generated-lockfile approval is pending.

# Acceptance criteria and evidence

All criteria remain incomplete: decoding/normalization, authorized persistence,
asset references, integration tests and access/retention documentation still need
implementation. No uploads or storage policy changes are included in this draft.

# Verification

Locked install, skill linking, isolated Supabase startup and existing migrations
passed. No implementation tests or full gate claimed yet. Dependency proposal is
docs/reviews/TICKET-175/dependency-proposal.md; plan and handoff contain exact scope.

# Risks and rollout

Bound decompression/encoding costs, reject malformed or ambiguous containers and
avoid persisting input bytes/metadata. Storage design remains reviewable work to do;
no service, account, schema/RLS or production operation is implicitly authorized.
No application behavior changes yet, so no product rollback step applies.

# Screenshots and UI checklist

N/A: planning documents only. The future editor UI is outside this ticket's scope.

# Harness changes

None. Tests, hooks, CI and native build permissions remain unchanged.
