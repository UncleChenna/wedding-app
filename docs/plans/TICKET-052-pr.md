# Ticket

TICKET-052 — Fill share messages from the PRD wording templates.

# Summary

Approved invitation copy contained unresolved placeholders and settings had no persisted voice choice. The new renderer fills WhatsApp, email subject/body, RSVP nudge and day-before messages using current couple names and the selected voice. Warm remains the approved default.

# Changes

- Pure validated plain-text renderer with single-pass literal replacement; Unicode and dollar-sign values remain literal, while braces, line breaks, invalid links and unsupported voices return expected errors.
- Shared voice schema/default plus an additive event_settings column and database constraint for warm/playful/formal.
- Server-only current-settings renderer and internal validated save helper that preserves unrelated event details. Callers retain guest/admin authorization responsibilities; no public mutation endpoint or sending is added.
- Approved PRD email/reminder wording stays identical across voice choices because no alternative versions were approved. Settings UI remains TICKET-101.
- Deterministic seeds inherit Warm; transactional integration tests restore the existing seeded singleton on rollback.

# Acceptance criteria and evidence

Every template is covered across all three voices, with no unresolved braces and exact email/reminder wording assertions. Literal replacement-looking values and malformed inputs are covered. Persisted voice changes alter the next generated invitation immediately; unrelated venue settings survive.18 final focused template/default/seed tests and4 database tests pass. Earlier broader focused suite37 tests and quick verification also passed.

# Verification

- Initial tests failed on missing renderer/default; database tests failed on the missing column before migration.
- Focused final tests:18 PASS. Transactional database tests:4 PASS against seeded data, with unchanged before/after counts.
- Generated migration applied twice; all row counts and applied-migration counts matched after the second run. A pre-existing synthetic settings row retained its venue and received Warm.
- RLS: enabled on all12 public tables. Deterministic seed run twice: identical counts, including248 guests and110 invitations.
- Quick gate passed lint, types and related unit tests; commit hooks recheck it.
- Mandatory pnpm t:pr full verification PASS: formatting, lint, types,489 unit tests (26 optional skips), production build and525 browser tests (135 skips). CLI recorded in_review and linked PR58. Final-head CI remains required before merge.

Integrated develop e381c810bc19404d7ded59a6155fc8977c1f474d in2c5048f. All database checks used only TICKET-052's managed stack; no production database was touched.

# Risks and rollout

Apply generated0005_blue_ravenous.sql before deploying code that selects invitation_voice. Existing rows backfill Warm. Owner explicitly approved the SQL, snapshot and journal and their exact authorization record. No RLS policy, dependency or secret changes. Roll back application code first and leave the additive column in place; never hand-edit an applied migration.

Rendering is not delivery: no invitation was sent or marked sent. Final copy proofreading remains TICKET-158. A future authorized settings UI must call the internal save helper only after admin authorization. Bodies already contain the invitation link; consumers must avoid appending it again and encode text for their transport.

# Screenshots

N/A: this ticket adds backend/template modules and a settings column, with no rendered UI change. Existing browser smoke coverage runs in the full gate.

# Review steps

Read docs/invitation-messages.md and the focused renderer tests. In an isolated managed worktree, apply migrations and run RUN_MESSAGE_DB_TESTS=1 pnpm exec vitest run scripts/**tests**/invitation-messages.integration.test.ts. Transactions roll back fixture changes, including seeded settings. Inspect the two-statement generated SQL and the three-choice database constraint.
