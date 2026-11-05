# PM phase status

5 November 2026. Ticket: TICKET-216. Integration base:
c9c9e66010ee773189477139d4f8b0d30cf481e1. Source candidate PR #92:
7ea316ba4bddcfcb418e7c180c2fae03af81e618.

Allowed states are exactly: Not started, In progress, Implemented locally,
Verified on the integrated commit, PM accepted, Externally blocked. Factual
updates may be recorded by the implementer; PM accepted requires explicit PM
acceptance with its date/source. No row is PM accepted. A historical test pass on
another base is not verification of this integration commit.

| Phase or foundation                            | Status              | Evidence / remaining scope                                                                                                                                                         |
| ---------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 Overall foundation repair/integration        | In progress         | Dedicated claimed TICKET-216; original checkouts preserved.                                                                                                                        |
| 0A New local environment                       | Implemented locally | Managed worktree outside iCloud; unchanged frozen dependencies installed and current develop migrations applied to its isolated local stack. Full integrated verification pending. |
| Original TICKET-212 dependency cache           | Externally blocked  | Cloud-only metadata stalls; protected rename needs a separate human record. Cache remains untouched and is not required by the new Phase 0 checkout.                               |
| 0B Foundation reconciliation                   | In progress         | Review PR #92 against develop; preserve applied chains, generate reviewed append-only integration artifacts and verify clean/populated targets.                                    |
| 0C Verification reliability                    | In progress         | Earlier production focus failures unresolved. Four-worker custom-dev control: 9 pass/63 fail; not a final production gate or causal explanation.                                   |
| Existing TICKET-212 crypto/service foundation  | Implemented locally | Historical 40 unit cases and one rollback-only local Postgres case; no browser persistence wiring, full gate or PM acceptance. Reuse in Phase 1.                                   |
| 1 Complete guest access/RSVP journey           | Not started         | Reuse foundation after Phase 0; routes/cookies/restart/multi-device/revocation/member/return-edit and privacy evidence required.                                                   |
| 2 Staff/admin invitations/imports/WhatsApp     | Not started         | Inspect/reuse existing staff/admin/auth/sharing foundations; full approved multi-role and delivery journeys not yet verified.                                                      |
| 3 Household check-in/seating/recovery          | Not started         | Reuse pass/admission foundations; atomic member arrivals/capacity and approved exceptions required.                                                                                |
| 4 Free ordering/stock/kitchen/bar              | Not started         | Inspect/reuse merged menu/ordering foundations; check-in/recipient/stock/service and complete operational journeys required.                                                       |
| 5 Waiter/delivery/alcohol/help                 | Not started         | Per-item claims/outcomes, recorded ID checks, refusal/failure and help workflows required.                                                                                         |
| 6 Notifications/admin/content/reminders        | Not started         | Introduce notification foundations earlier where preceding features need them.                                                                                                     |
| 7 Retention/exports/backups/outage operations  | Not started         | Build audit/permissions into preceding phases; hosted backup/restore and operational inputs remain external.                                                                       |
| 8 Complete UI review/polish                    | Not started         | Reuse tokens/components; preserve provisional design, obtain missing amendment/assets, verify devices/accessibility/reduced motion.                                                |
| 9 Private staging/load/devices/staff rehearsal | Not started         | No deployment authorization; requires target, device, staff and infrastructure inputs.                                                                                             |

Not started refers to the PM phase/journey, not an instruction to rebuild existing
components. Inspect and reuse prior work. See the full approved brief and detailed
checklist; no old requirement is silently dropped or treated as accepted.
