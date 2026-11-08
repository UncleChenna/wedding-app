# TICKET-175 image decoder proposal

Propose adding exact runtime dependency `sharp@0.35.5` using pnpm. This exact
version is already installed transitively by Next in this checkout; a direct
declaration provides a stable supported import instead of relying on Next internals.
It supplies bounded real decoding, EXIF orientation, metadata stripping, WebP
encoding and thumbnail generation required by this ticket.

Changes: generator-managed `package.json` and `pnpm-lock.yaml` only. No change to
`pnpm-workspace.yaml`, native build-script permissions, CI or RLS is proposed.
The native package already loads in this checkout. No new account or paid service.

Approval requested: install/use this direct native runtime dependency; generate
and commit the lockfile; record exact-path authorization for `pnpm-lock.yaml` in
`.worktrees/TICKET-175/.harness/approved-writes.json`. Do not fabricate approval.

Validation after approval: malformed/decompression-limit/orientation/metadata
fixtures, platform build and full repository checks. Rollback removes the direct
dependency through pnpm; it does not alter Next's independent transitive dependency.
