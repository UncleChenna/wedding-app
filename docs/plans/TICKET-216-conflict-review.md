# TICKET-216 conflict review — 6 November 2026

Resolution plan only; no working merge yet. Compare develop c9c9e66 with T211
7ea316ba. Virtual merge reports 16 conflicted paths; source approval is pending.

| Paths                                                                                  | Preserve and reconcile                                                                                                                                       |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| docs/learnings.md                                                                      | Both sets of verified lessons, with historical evidence qualified by actual commit/runtime.                                                                  |
| drizzle/meta/0006_snapshot.json, 0007_snapshot.json, 0008_snapshot.json, _journal.json | Develop applied lineage; archive original fork bytes with provenance; generate append-only integration SQL. See migration-history and source-approval plans. |
| e2e/invitation-pass.spec.ts                                                            | Current routing/pass rules with T211 versioned submissions against actual pages.                                                                             |
| e2e/rsvp-live.spec.ts, rsvp-review.spec.ts                                             | Newer party/detail/history flows, cutoff/error assertions, revision and request IDs. Document database-dependent skips.                                      |
| scripts/seed.ts                                                                        | Current staff/order fixtures and target guards with coherent deterministic member/aggregate responses. No real guest fixtures or token reissue.              |
| invitations/**tests**/rsvp-actions.test.ts, submit-rsvp.test.ts                        | Rate-limit, typed route, error, cutoff, malformed revision, conflict and replay assertions from both branches.                                               |
| invitations/components/personal-invitation.tsx                                         | Party form, next-step navigation, pass/notices plus reply revision metadata.                                                                                 |
| invitations/components/rsvp-form.tsx                                                   | Accessible current copy/states with revision/request handling and conflict/retry feedback.                                                                   |
| invitations/server/rsvp-actions.ts                                                     | Action budget, typed invitationHref revalidation including locked results, external version validation, non-sensitive errors.                                |
| invitations/server/save-rsvp.ts                                                        | Locking, cutoff/time zone, internal clock callers and member writer. Never invent an expected revision for an unvalidated external request.                  |
| invitations/server/submit-rsvp.ts                                                      | Validated attendance/cutoff and conflict/replay mapping, without hiding errors or exposing credentials.                                                      |

## Adjacent behaviour missed by text conflict detection

Develop server/party.ts saveParty edits membership/diet/aggregate attendance but
knows nothing of member responses, revisions or receipts. Keeping it untouched
risks stale member/aggregate state. This is a reviewed integration risk, not an
observed failure on an integrated branch; none exists yet.

Required regressions: mixed member response followed by name/diet edits without
attendance changes; permitted synthetic membership changes preserve aggregate
projection and revision; stale member edits fail after a party change; cutoff,
reopening, arrival/history constraints and audit remain intact. Admin-approved
extra guests remain a later PM requirement, not proven by existing allowance.

Wire compareMigrationHistory into imported safe-migrate before ordinary Drizzle
execution. Nine contracts pass including the real divergent fork, but execution
wiring is pending. A later timestamp must never make a divergent chain safe.

The automatically merged schema still needs review to retain current ordering,
staff identity and request-budget tables and RLS. No whole-file selection can
replace these behavioural checks. Full module paths above start at
src/modules/invitations; e2e short names share the e2e directory.
