# TICKET-181 published-theme migration review

Integrated develop: `205cc66350864c0a4f57c392db7b663ff20bf25c`.
Generated using `pnpm db:generate --name theme-published-tokens`.

Current outputs: `drizzle/0015_theme-published-tokens.sql`,
`drizzle/meta/0015_snapshot.json`, `drizzle/meta/_journal.json`.
Authorization record: `.worktrees/TICKET-181/.harness/approved-writes.json`.

```sql
ALTER TABLE "themes" ADD COLUMN "published_tokens" jsonb;
```

The user approved the original 0013 on 2026-11-05 and explicitly approved the
integration proposal, exact protected paths and isolated reset on 2026-11-07.
See [integration proposal](base-update-proposal.md). Develop's outbox0013 and
photo0014 SQL/snapshots and lockfile remain byte-identical to the pinned commit.
The branch-only theme0013 was replaced through Drizzle generation as0015.

Existing theme rows receive NULL; editable tokens remain intact. No policy or
RLS change is introduced. Draft writes affect tokens/name only. Publication
copies validated tokens and singleton selection in one transaction. Published
readers retain preset fallback for rows without a published snapshot.

The owned database was verified empty except for a known local-test rate-limit
bucket before the approved reset. Managed reset applied all16 migrations and
seeded deterministic fixtures. A second migration run preserved all counts;
all18 public tables retain RLS. Five publication tests pass, covering draft/live
separation, invalid input, preserved identity/fallback, post-write rollback and
concurrent publication across separate connections. Full integrated verification passed: formatting, lint, types, build, 1089 unit
tests (107 opt-in skips), and 837 browser checks (189 skips). The dedicated
publication browser rerun passes (1.1 minutes), with 24 unchanged captures.

No production application or PR merge is authorized. Apply the reviewed additive
migration before deploying the new readers. Application rollback can retain the
nullable column and snapshots; deleting published data is not part of rollback.
