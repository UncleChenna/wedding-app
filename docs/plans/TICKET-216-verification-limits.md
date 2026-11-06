# TICKET-216 verification scope — 6 November 2026

This checkpoint precedes the protected source merge. It is not verification of
PR92 integrated with develop, acceptance of a PM phase, or wedding readiness.

| Check                                                    | Actual result                                    | Limit                                                                                                      |
| -------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| verify:quick                                             | Lint/types pass; nine tests pass, three skip     | Source integration not present.                                                                            |
| Full unit suite, default settings                        | 1,034 pass, 99 skip; exit 0                      | Local database opt-ins not generally enabled.                                                              |
| Explicit lineage/preview suite                           | 12 pass, exit 0                                  | Nine pure contracts, three disposable local PostgreSQL cases; ignored generator preview, not final source. |
| Production build                                         | Pass on ae13c7085776666e6483d9a5359002d6c853a314 | Same baseline application as current develop, with documentation.                                          |
| Default four-worker production envelope control          | 72 pass, no skips                                | First-visit cases, three repetitions across mobile/desktop.                                                |
| Default four-worker production invitation-letter control | 78 pass, no skips                                | Whole file, three repetitions across mobile/desktop.                                                       |

Sandbox-restricted unit run: 1,019 pass, 15 fail, 99 skip plus three unhandled
EPERM errors. Re-running unchanged with normal permission for local sockets and
disposable repositories passed as above. Initial letter server startup similarly
received EPERM; the normally permitted run passed. Neither is the original
keyboard timeout. No assertion, timeout, retry, hook or worker setting changed.

## Conditional skips

The 99 unit skips comprise 18 opt-in database suites and one PDF visual-review
case. The database suites cover: invitation schema/repository/pass,
RSVP persistence and cutoff/history, party details, message persistence, event
settings, ordering constraints/migration/submission, staff identity/devices/PIN
attempts/admin/migration, rate budgets and the new three-case migration preview.
These require explicit flags and disposable local fixtures to avoid modifying an
unselected database. Only the new three cases were enabled in this checkpoint.
The ordinary full unit count must not be presented as database verification.
The skipped PDF visual-review case also leaves its rendered review unverified.

Browser opt-ins include RUN_RSVP_BROWSER_TESTS, RUN_RSVP_REVIEW,
RUN_INVITATION_DETAILS_TESTS, RUN_PARTY_BROWSER_TESTS, pass/offline/signing modes,
admin Auth/MFA/settings/staff/menu, order/menu and isolated request-budget modes.
Missing-key pass review and signed-pass review select different cases; passing
one mode does not verify the other. Phone-only layout/a11y duplicates skip the
desktop project intentionally, but are not real-phone testing.

Consequently final integrated member/aggregate persistence, concurrent edits,
retry receipts, deadlines/reopening/history, signed/offline passes, complete
guest session access, admin permissions/MFA, ordering/stock and staff operation
remain unverified here. The Phase 0 RSVP cases must run after integration; later
PM phases require their complete journeys, not merely enabling old flags.
CI has separate selected journey/database jobs; report their actual final-head
results independently rather than assuming a generic verify job covers all opts.

## Original default-worker failure

The preserved original trace has a reply-focus expectation spanning about
28.4 seconds inside a 30-second test timeout, despite a 5-second expectation
message. It does not establish whether focus failed or what caused the delay.
The fresh production controls pass; the earlier custom development-server
control failed 63/72 and is a different runtime. No cause is established among
application behaviour, shared state, server lifecycle or resource limits.
Do not prescribe or claim a worker cap as a proven fix from these controls.

## Evidence

Ignored artifacts/TICKET-216 contains the build, quick, full-unit, baseline
control JSON/logs and original trace; see the handoff for exact filenames.
Protected source authorization is still pending. Hosted applied history is
unknown; the destructive legacy bridge remains separately execution-blocked.

## Pushed preparation CI evidence

Commit dca3f197f7c4fc0e22472f6818e853f8fe4edb7a passed every required job in
https://github.com/UncleChenna/wedding-app/actions/runs/42270756098 : ticket
validation, PR text, migration/seed/schema drift, mobile/desktop invitation
journey and full pnpm verify. Verification reported 1,034 unit passes/99 skips
and 837 browser passes/189 skips (two CI workers, 13.9 minutes for browser tests),
with no failed or flaky summary. Optional review was skipped by its opt-in job
condition; no provider configuration or paid review was enabled. This commit
still contains no working PR92 source integration. Later documentation-only
checkpoints must report their own CI status separately.
