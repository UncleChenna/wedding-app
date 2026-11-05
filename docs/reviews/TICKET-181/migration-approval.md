# TICKET-181 published-theme migration review

Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1.
Generated using pnpm db:generate --name=theme-published-tokens.

Exact outputs: drizzle/0013_theme-published-tokens.sql,
drizzle/meta/0013_snapshot.json, drizzle/meta/_journal.json.
Approved authorization record: .worktrees/TICKET-181/.harness/approved-writes.json.

The generated SQL is one additive statement:

```sql
ALTER TABLE "themes" ADD COLUMN "published_tokens" jsonb;
```

Existing rows receive NULL; existing tokens remain intact. No data is rewritten,
no policy changes, no RLS change. Snapshot inspection shows only public.themes
changed. Draft writes update tokens/name only. Publication copies validated tokens
into published_tokens and updates the singleton light/dark selection within one
transaction. Existing preset resolution must remain the fallback for pre-publication
rows; the published reader integration is now implemented but still awaits real database verification.

The user approved isolated testing and commit of these exact generated files,
and recording the approval on 2026-11-05. The ignored authorization record is written. No production migration, reset or data deletion.
The migration has NOT been applied. Required tests: repeat migration/counts, RLS,
existing-row preservation, draft/live isolation, concurrent activation, rollback,
and initial HTML/artifact loading. Current quick gate has 59 passes/66 opt-in skips;
these are not database verification.

PR99 and PR103 own independent pending migration0013 files. Before sequential
integration, obtain explicit base update and regenerate/reconcile unmerged outputs;
never overwrite an applied migration or its journal. This proposal does not approve
future differently named files. Application rollback leaves the nullable column and
published snapshots intact; dropping data is not part of rollback.
