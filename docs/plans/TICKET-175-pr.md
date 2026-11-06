# Ticket

TICKET-175 — Validate and store invitation photo uploads. Target develop.

# Summary

Prepare the isolated implementation of admin-only photo uploads. The finished
pipeline must decode and validate real image bytes, strip metadata, correct
orientation and return a controlled asset reference with dimensions and blur data.
This draft implements the internal decoder; authorization, persistence and the upload endpoint remain unfinished.

# Changes

- Claimed ticket and initialized its isolated managed database/worktree.
- Defined proposed format, byte, pixel and output bounds and fixture test coverage.
- Proposed direct sharp0.35.5 dependency, already loaded transitively through Next;
  the user approved the dependency, generated lockfile and exact-path authorization record. No build-script permissions changed.
- Added bounded real JPEG/PNG/WebP decoding, strict container boundaries, EXIF orientation, metadata removal and canonical WebP/blur output.

# Acceptance criteria and evidence

The decoder passes12 real-image tests. Overall criteria remain incomplete: authorized persistence,
asset references, integration tests and access/retention documentation still need
implementation. No uploads or storage policy changes are included in this draft.

# Verification

Locked install, skill linking, isolated Supabase startup and existing migrations
passed. verify:quick passes lint, strict types and12 real-image tests. Full verification is not yet run. Dependency proposal is
docs/reviews/TICKET-175/dependency-proposal.md; plan and handoff contain exact scope.

# Risks and rollout

Bound decompression/encoding costs, reject malformed or ambiguous containers and
avoid persisting input bytes/metadata. Storage design remains reviewable work to do;
no service, account, schema/RLS or production operation is implicitly authorized.
No application behavior changes yet, so no product rollback step applies.

# Screenshots and UI checklist

N/A: server decoder only; no route or UI is exposed. The future editor UI is outside this ticket's scope.

# Harness changes

None. Tests, hooks, CI and native build permissions remain unchanged.
