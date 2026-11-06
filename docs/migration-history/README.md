# Preserved experimental migration history

TICKET-216 preserves seven divergent TICKET-211 SQL/metadata files in
TICKET-211-7ea316ba.tar.gz, produced using Git archive from source revision
7ea316ba4bddcfcb418e7c180c2fae03af81e618 (PR #92). The manifest records archive
and file SHA-256 values/lengths. All seven regular files matched the source
byte-for-byte before publication. The source remains in Git and the old
worktree/database are preserved. This is provenance, not active migration source.

Do not extract it over drizzle or execute it on develop or a hosted database.
The branches share only six migrations. See the TICKET-216 migration-history,
source-approval and conflict-review plans before reconciliation. This archive
grants no execution, deletion, token reissue, shared merge or PM acceptance.
