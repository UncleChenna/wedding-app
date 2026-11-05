# Ticket

TICKET-043 — Revoke and reissue invitations so old links and QRs stop working.

# Problem and result

Administrators can now revoke an invitation or replace its link from Admin Sharing,
with an explicit confirmation. The old link stops working online, saved replies
remain intact, and each successful change records the authenticated actor and time.
Disconnected scanners learn the change after refreshing their snapshot; the UI
states this limitation explicitly.

Draft pending physical-device UI evidence or a preview exception. No production
migration application or PR merge is authorized by the migration approval.

# Changes and acceptance evidence

- Strict commands check expected status/version to reject stale administrative edits.
- A row-locked transaction changes status or rotates the token/version and inserts
  the audit event atomically. Collision retries are bounded; other errors propagate.
- Audit records omit invitation capabilities, contact details, IP addresses and PINs.
- Gate-session-protected revocation snapshots expose only IDs, status/version and
  timestamps, with private/no-store responses and safe denial/unavailable errors.
- Signed old pass versions return “Replaced pass”, matching ADR0020. Snapshot
  freshness contracts are covered; scanner download/UI and real offline refresh
  testing remain mandatory in dependent TICKET-065.
- Real authenticated mobile/desktop journeys prove cancellation causes no change,
  old links return 404 after reissue, new links work, revoked links return 404,
  replies survive, and both audit events contain the authenticated actor/time.

# Validation

Verified against the explicitly approved develop base 5747c3d.

- Full `pnpm verify` at 599355c: formatting, lint, types and build pass;
  1044 unit tests pass / 95 skip; 849 browser checks pass / 183 skip.
- Four opt-in isolated PostgreSQL lifecycle tests pass: rotation/audit, revocation
  with RSVP preservation, audit-failure rollback and concurrent reissue arbitration.
- Repeated migration and seed runs preserve counts; all 17 public tables retain RLS.
- Focused production preview suite: 16/16 pass, including axe AA on both dialog
  states across themes/widths and default-theme load CLS=0 at three widths.
- Authenticated lifecycle suite: 2/2 mobile/desktop pass; measured page-load CLS=0.
- Authenticated matrix: both dialogs in four themes at 375/540/768/1024/1280 pass
  keyboard opening, Tab wrapping, Escape/focus return, no overflow and 44px buttons.
- All 48 screenshots inspected: preview and authenticated routes, four themes,
  three required widths, both dialogs. No clipping or unreadable action was found.

Opt-in database/auth tests are not silently counted as passing in the default
suite; the explicit runs above provide their evidence. Physical phones, WhatsApp
in-app browsers and physical safe areas remain unverified. No QR rendering or
Open Graph assets changed. Guest Lighthouse release gates remain unchanged.

# Review steps and screenshots

Use a synthetic household on the migrated isolated database. Sign in with an
allowed administrator and TOTP, open `/admin/sharing`, cancel a revoke operation,
then reissue. Check the old link fails and the replacement opens. Revoke and check
that link fails too. Saved replies and actor/time audit records should remain.

For a non-mutating UI preview, open `/dev/share` and try both dialogs in each theme.
Full item-by-item evidence: [UI review](../blob/TICKET-043/docs/reviews/TICKET-043/ui-review.md).
Screenshots: [all captures](../tree/TICKET-043/docs/reviews/TICKET-043/screenshots).

![Mobile reissue](../raw/TICKET-043/docs/reviews/TICKET-043/screenshots/admin-ivory-gold-375-reissue.png)

# Migration, rollout and rollback

The approved generated 0013 migration adds one RLS-enabled audit table, without
changing existing data or policies. Exact-path authorization is recorded locally;
isolated application, repeatability and lifecycle tests pass. Review details are
in `docs/reviews/TICKET-043/migration-approval.md`.

Deploy the additive migration before the consuming application only after production
approval. Application rollback should preserve the table and its audit history.
The audit is not tamper-proof against a privileged SQL administrator. Offline
scanners can accept old passes until refresh under ADR0020.

# Remaining work

Physical iOS/Android WhatsApp and safe-area checks, or an explicit preview exception
retaining these release requirements, precede final UI approval. Required GitHub
checks must pass before merge; this draft has not been merged. No harness, CI,
policy, or dependency changes are included.
