## Problem and result

TICKET-012 starts database-backed light/dark selection while preserving device colour preferences. This is an unfinished checkpoint, not ready to merge.

## Changes

- Add a dark theme settings field alongside the existing light field.
- Validate stored pairs, fall back with a sanitized warning, cache server CSS and browser colours.
- Add an internal persistence/activation service that invalidates only after a successful write; no public action exposed.

## Evidence

23 unit tests and quick lint/types passed. Seven isolated database tests pass. Two migration runs produce identical counts, and all12 tables retain RLS.

## Remaining work and risks

Generated migration artifacts were explicitly approved and are committed. Do not deploy this branch. Deterministic seeds and actual stored-theme browser verification pass. A full-gate rerun and final UI write-up remain after fixing a detected private-response cache regression. Direct SQL updates use the cache TTL; immediate refresh requires the activation service. Future admin callers must authorize access. The database migration was tested only on this ticket's empty isolated stack.

## Rollback

No production deployment or remote database change; only the isolated local stack was migrated. Keep the additive column when reverting application code; no destructive down migration is proposed.
