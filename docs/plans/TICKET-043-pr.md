# TICKET-043: revoke and reissue invitations

Administrators can revoke an invitation or replace its link from Admin Sharing,
with confirmation. The old link stops working online, saved replies remain intact,
and every successful change records the authenticated actor and time. Disconnected
scanners learn the change after refreshing; the UI explicitly explains this limit.

## Changes and acceptance evidence

- Live administrator authentication and strict expected-status/version commands
  protect the action. A row lock serializes it with RSVP changes; audit insertion
  and capability rotation are atomic, with bounded collision retries.
- Reissue rotates the token and increments its version; old links return a neutral
  404, the new link works, and an old signed pass is classified as replaced after
  a snapshot refresh. Revoke preserves the saved RSVP but removes online access.
- Gate-session-protected snapshots expose only IDs, status/version and timestamps,
  with private/no-store responses. Actual scanner download and offline refresh
  testing remain mandatory in dependent TICKET-065.
- Independent review identified lost keyboard focus when successful revoke removes
  its opener. A browser regression reproduced it; one-shot restoration now focuses
  the surviving Reissue action after the dialog closes and updated state arrives.
  Initial rendering, cancellation and reissue do not arm this fallback.
- Audit records contain actor/time and transition details, without capabilities,
  guest contacts, IP addresses or PINs.

## Verification

Integrated develop `37e9202c`. The complete local gate passed on the resulting
implementation: formatting, lint, types, production build, **1,157 unit tests**
(121 opt-in/skipped), and **863 browser tests** (189 opt-in/skipped, 4.4 minutes).

Separate opt-in evidence:

- Four real PostgreSQL lifecycle tests pass: rotation and lookup, revoke preserving
  replies, audit-failure rollback and concurrent reissue arbitration.
- Five current-schema admission tests and all ten admission migration/backfill/
  seed-rollback tests pass after integration.
- Two authenticated production-browser journeys pass on mobile and desktop in
  6.8 seconds, including keyboard confirmation, old/new link requests, saved
  replies, actor/time audit records and focus after successful revoke.
- Repeat migration and repeat seed counts match: 20 migrations and 21 public
  tables, all with RLS enabled. Only the proven synthetic owned database was reset.
- All-theme/width lifecycle accessibility, reduced-motion, cancellation, focus
  return and default-theme zero-CLS checks pass in the full gate. The existing
  48 reviewed screenshots remain applicable: no layout/style change was made by
  the focus fix. The actual ivory/gold 375px revoke capture was reinspected.

Disclosed failed attempts: the first focus test reproduced the reviewed defect;
initial authenticated reruns needed the required synthetic allowlist and fresh
per-run email addresses. A full-gate attempt stopped because an obsolete local
lockfile authorization conflicted with a new harness-test assumption. Removing
that no-longer-needed authorization restored default protection; all 46 unchanged
hook tests and the subsequent full gate passed. No assertions, hooks or timeouts
were weakened.

## Review steps and UI evidence

On a migrated isolated database, sign in as an allowed administrator with TOTP.
Open `/admin/sharing`, cancel a revoke, then reissue a synthetic invitation. Check
that the old link fails and the new link works. Revoke with the keyboard and check
focus lands on Reissue, the link fails, and the reply/audit history remain.
`/dev/share` provides a non-mutating preview.

[UI checklist and limitations](../blob/TICKET-043/docs/reviews/TICKET-043/ui-review.md)
· [Screenshots](../tree/TICKET-043/docs/reviews/TICKET-043/screenshots)

![Mobile confirmation](../raw/TICKET-043/docs/reviews/TICKET-043/screenshots/admin-ivory-gold-375-revoke.png)

## Migration, rollback and remaining release gates

Generated `0019_invitation-lifecycle.sql` adds one RLS-enabled audit table; its SQL
is byte-identical to this branch's formerly reviewed 0013 migration. Develop's
0013–0018 history is preserved. Exact-path authorization and the synthetic-target
verification are documented in `docs/reviews/TICKET-043/migration-approval.md`.
Deploy the additive migration before its consuming application. Application
rollback should retain the table and audit history; no production migration was
applied here. Privileged database administrators can still modify audit records.

Physical iOS/Android WhatsApp and safe-area checks remain unverified and retained
as release requirements under the owner's preview exception. This does not claim
release readiness or certify TICKET-065's future offline scanner journey. Final
GitHub checks and independent final-head review are required before merge.
