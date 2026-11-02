# 0022 — Member RSVP authority and controlled bootstrap upgrade

- Status: Proposed for human review — 2026-11-02 — TICKET-211.

## Context

The owner replaced invitation-wide attendance with named person responses, mixed households, optimistic edits and a one-year retention policy. Current pass issuance still depends on aggregate invitation status/count. Committed0001 fails on populated0000 data and must not be rewritten.

## Decision

Use guests as stable member identities within this deployment's single wedding event. Add age band without inferring verification, invitation kind/revision/reopening and member_rsvps with a primary key per guest plus a composite invitation/member FK. Tokens remain separate from person identifiers. New responses lock the invitation, check capability/status, compare expected revision, enforce the configured cutoff, validate membership, write per-person answers/diet, append history and insert a scoped UUID/digest receipt in one transaction. Identical retries return the original outcome; mismatched request reuse and concurrent stale revisions fail visibly. Aggregate rows/status are a compatibility projection for current passes, not a second independent writer.

Use additive Drizzle migrations and a guarded bootstrap bridge. It snapshots validated legacy data privately, executes all unchanged pending SQL and restores identities inside one exclusive transaction. Tokens matching the current format stay stable; format validation alone does not prove their original entropy. Weak bootstrap codes require a separate explicit reissue acknowledgement. Refuse ambiguous data rather than guessing or merging. RLS remains enabled with zero new browser policies; this decision grants no production access.

## Consequences

The current simple form now supplies revision/retry metadata and uses the same member writer, gaining cutoff/history/conflict protection. Full per-member guest UI, approvals, global reopening, scoped sessions and staff workflows remain separate incomplete phases. Historical edits cannot be reconstructed from missing history; only future changes are audited. Archive/receipt/history retention and backups require the later operational retention implementation. Existing source/schema proposals on other owners' branches require deliberate reviewed integration.
