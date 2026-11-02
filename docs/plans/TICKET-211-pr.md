# Ticket

Ticket: TICKET-211. Target: develop. Draft only until the checks and review requirements below are resolved.

# Summary

A populated original database could not upgrade safely, and invitation-wide RSVP edits silently overwrote one another without enforcing a deadline or writing history. This first foundation slice adds a controlled transactional upgrade and a shared member response writer. The existing form now carries revision/retry metadata, rejects stale edits, enforces the cutoff and preserves the signed-pass projection.

# Changes

- Add household/member metadata, member responses, scoped retry receipts and restricted migration archive through generated0006–0008 migrations. RLS stays enabled; no browser grant is added. Preserve large legacy groups without creating extra people.
- Run the original pending migration SQL with validated legacy conversion and original database JSON/timestamp preservation in one transaction. Refuse implicit upgrades, ambiguous source data and unapproved weak-code replacement. Stable identifiers/contacts/check-ins/RSVP meaning survive; a forced failure restores schema/data/journal together.
- Write mixed attendance/diet, person counts, optimistic conflicts, replay receipts and before/after history atomically. Adapt the existing yes/no form and retain current pass behavior.
- Update deterministic seeds and local fixture cleanup. Record the complete revised requirements and remaining phases, rollout/recovery, ADR0022, environment blockers and operating draft.

# Acceptance criteria and evidence

- Requirements map: `docs/implementation-checklist.md` covers the complete mandate and distinguishes verified primitives from incomplete journeys.
- Upgrade/data preservation: populated individual/group/shared-contact/partial-state and large-group tests; rollback and exact original-record regression. Applied0000–0005 are unchanged.
- Member transaction: mixed answers/diet, membership/FK uniqueness, revision concurrency, duplicate request replay, exact deadline and controlled household reopening tested. The existing form surfaces refresh/contact instructions.
- Repeat migrations/seeds and RLS: local logs and handoff. No schema drift,9 migrations,15 public tables all RLS. Counts unchanged on repeated migrations/seeds.
- Full gate: **incomplete** pending the human protected-file authorization record; current result is665 pass,42 opt-in skips,3 hook failures. No tests/hooks weakened.
- Review/rollout notes available. Production/hosted/physical/full-app readiness is not established.

# Verification

See `docs/handoffs/TICKET-211.md` for exact logs/results and commands. Database integration37 pass; final bridge preservation suite6 pass; targeted units33 pass; real RSVP mobile/desktop10 pass; additional pass/RSVP4 pass; visual review12 cases/60 states pass. Formatting/lint/types pass; production build passed separately. Separate browser smoke:697 passed,147 opt-in skipped. Required full gate stops at the human migration-file hook as described above. Any subsequent result must replace this status before review.

# Risks and rollout

This is phase A/member-RSVP foundation only. Member editing/approvals, persistent sessions/staff roles, seating, stock/orders/delivery/alcohol, durable notifications/provider, content/retention/holds/backups, approved envelope and end-to-end rehearsal remain incomplete. The365-day default is not a deletion job. History/receipts/archive contain personal data and require later retention/access controls. Legacy history cannot be reconstructed.

Follow `docs/migration-rollout.md`: verify backups/restoration and rehearse on isolated restored data; require maintenance/no writes for the original bootstrap conversion; deploy schema before code. Reissue obsolete weak links only with explicit operator acknowledgement and deliberate redistribution. No message is sent. Do not drop tables to roll back; transactional failures preserve the source, committed conversion needs a verified restore or reviewed fix forward. No public deployment or production migration has run.

# Screenshots

`docs/reviews/TICKET-211/README.md` records all checklist outcomes and includes representative mobile/desktop captures. Full local60-image set: `artifacts/TICKET-211/rsvp` (all four themes ×375/768/1280 ×five states). Synthetic names/settings only.

# UI checklist

PASS: existing-layout screenshots, tokens, restraint/typography, keyboard, reduced motion, automated contrast, clear copy, shared controls and emulated44px/no-overflow checks. N/A: new component showcase/staff feedback; no new component or staff UI. Not verified: Lighthouse95/CLS, physical WhatsApp previews/iOS/Android, physical QR scans and device safe-area handling. Full UI decision remains CHANGES REQUESTED. No visual-fidelity claim while the reference requires owner sign-in.

# Harness changes, if any

Hooks/skills/CI remain unchanged. The existing migration approval requirement is honored. Local-only fixture helpers clean their own synthetic records transactionally; they do not grant production deletion permission.
