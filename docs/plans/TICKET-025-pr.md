# Ticket

TICKET-025: Add event settings and RSVP change-log tables.

# Summary

Adds a database contract for draft wedding settings and an append-only RSVP change history. Missing settings return typed approved defaults; persisted values are validated. Runtime users cannot update, delete or truncate history. This is the storage foundation; it does not implement RSVP editing or the admin settings UI.

# Changes

- Singleton settings constrained to id1, with couple/date, optional event details, RSVP cutoff, active theme, tag-along/retention and bounded ordering fields.
- Preserve Uchenna/Adaora,19 December2026, one tag-along and90-day retention. Undecided venue/time/time zone remain null; ordering remains closed.
- Typed Drizzle accessor returns fresh defaults only for an absent row; invalid data and database failures remain visible to callers.
- RSVP before/after object snapshots, actor and timestamp reference invitations with RESTRICT. A statement trigger rejects update/delete/truncate; runtime mutation grants are revoked. RLS remains enabled without browser policies.
- Approved generated migrations0002/0003 and deterministic local seed support were committed in e72852a. This follow-up corrects the raw-driver date test and verifies the public accessor against Postgres.

# Acceptance criteria and evidence

- Singleton: database tests reject a second id1 row and id2. An absent draft row is intentionally permitted for accessor defaults.
- Typed defaults/accessor:15 unit tests and a real Drizzle-backed regression cover unset and configured values, including Date/string/time conversion and unknown venue details.
- Append-only history: insert succeeds; update/delete/truncate fail even for ordinary owner statements; invitation deletion cannot cascade history away. anon/authenticated/service_role mutation grants are absent.
- Six real database tests pass and roll back fixture writes. See docs/reviews/TICKET-025/verification.md for exact environment and counts.

# Verification

Against isolated project wedding-c4ce5584db6b, DB27641: migrations run twice with identical12-table/four-migration counts; RLS check passes on all12 public tables. Deterministic seed runs twice with identical counts, followed by all6 DB tests passing again. Targeted tests:21 passed. Quick gate passes lint/types; its opt-in skips are not database evidence. Full pnpm t:pr verification passed: 420 unit passes/16 opt-in skips, production build success, 415 browser passes/111 conditional skips in 3.5 minutes with no retries. The six database cases were separately enabled and passed. CLI status is in_review; final-head CI must pass before human merge. Prior committed migration head e72852a passed CI40519769549, including repeat migrations, seed and schema drift checks. Base develop:763430841153fe7b8fdba68594e0b4af54d56adc.

# Risks and rollout

Apply0002 before0003 through Drizzle. No existing data is deleted by migrations; production execution is not authorized by this local rehearsal. No UTC cutoff is inferred while venue time zone is undecided. Ordering limits are stored defaults, not enforcement. Table administrators can alter DDL; history is not tamper-proof against them. Authorized retention maintenance belongs to TICKET-127. The local-only seed temporarily disables the history trigger inside a transaction, then restores it; do not run it against real guest data.

Rollback application code while retaining added tables/history. Destructive down migrations and history purge need separate approval. Consumers and admin UI remain separate tickets. Do not merge while required checks are failing or pending.

# Screenshots

N/A: no UI changes.

# UI checklist

N/A: no rendered interface, styles, images or motion changed.

# Harness changes

No hooks or gates weakened. Reconciled a stale handoff/ledger blocker against committed and hosted evidence; final verification results follow in the handoff.
