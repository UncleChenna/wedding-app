# Ticket

Ticket: TICKET-024

# Summary

Store invitation-level partial admissions and immutable scan evidence without losing historical guest-level check-ins. Canonical admissions cannot exceed the authoritative RSVP allowance; excess offline physical reports remain recorded as conflicts.

# Changes

- Add RLS-enabled admission counters and scan events with five results, unique client retry IDs, nullable unknown invitations, staff/device references and query indexes.
- Generate migrations0016–0018: additive schema, deterministic preservation backfill, then append-only and cross-table guards. Existing migrations and check_ins rows remain unchanged.
- Count admissions from immutable events, reject forged allowances and unsafe RSVP reductions, and preserve concurrent final-seat correctness under the documented invitation-first lock order.
- Execute preservation/constraint tests against the final generated files, including populated modern and bootstrap fixtures.

# Acceptance criteria and evidence

All functional storage criteria have evidence in `docs/reviews/TICKET-024/verification.md`: nine generated-file tests cover results/counts, retry identity, unknown invitations, live identity, RLS, preservation, append-only guards and concurrent allocation. Repeat application leaves all counts unchanged. Full repository verification also passes; the ticket is ready for review, not merged.

# Verification

- Nine isolated-schema tests pass against final generated SQL.
- Applied-schema tests: five pass; four preservation/concurrency fixtures run separately in isolated schemas, where all nine pass.
- Two migration runs pass; both post-run counts match (19 migrations,20 public tables).
- RLS enabled on all20 public tables.
- Quick verification passes lint/types; opt-in database tests were run explicitly.
- Full verification passed:1089 unit tests/116 skipped, production build,837 browser smoke tests/189 skipped; terminal exit0.
- Initial public test run before migration failed for absent tables; subsequent temporary-schema and applied runs passed. Assertions and timeouts were not weakened.

# Risks and rollout

User approved generation, isolated testing, commit and exact-path authorization, not production application or PR merge. Base: develop2706b96. No reset or existing-data deletion performed. Keep0001 away from populated pre0001 deployments; bootstrap fixtures do not certify that earlier migration as a safe upgrade. Consumer transactions lock invitation before RSVP/counter and never double-increment counters. Guards intentionally reject evidence deletion and reductions below admissions; retention needs a separately reviewed operation. Rollback application code while retaining additive data; no destructive down migration is provided.

# Screenshots

N/A: backend schema/tests only; no rendered UI change.

# UI checklist

N/A: no UI, typography, motion, metadata or QR rendering change.

# Harness changes, if any

None. Existing generators, isolated-target checks, approval hooks and verification gates remain enabled.

## CI seed repair

The original CI seed TRUNCATE CASCADE was correctly rejected by the new append-only guards. The user approved extending the existing local-only seed reset transaction: disable only the five named guards (existing RSVP history plus four admission/source guards), explicitly reset admission tables, and restore every guard before inserting fixtures. Production targets remain rejected; applied migrations are unchanged.

Two isolated synthetic seed runs now succeed with identical counts. Ten isolated-schema regression tests pass, including rollback/restoration, and five post-seed public-schema checks pass with every guard enabled. RLS remains enabled on20 tables. Full verification of this repair and replacement CI are pending; do not merge until they pass.
