---
id: TICKET-169
title: Approve offline freshness and the gate credential contract
epic: checkin
status: in_review
priority: urgent
estimate: S
labels: [human, security, docs]
module: checkin
owner: unclechenna
agent: claude
blocked_by: []
blocks: [TICKET-031, TICKET-056, TICKET-108, TICKET-161]
branch: TICKET-169
pr: https://github.com/UncleChenna/wedding-app/pull/69
created: 2026-10-21
updated: 2026-11-01
started: 2026-11-01
completed: ""
reason: ""
resume_to: ""
---

# TICKET-169: Approve offline freshness and the gate credential contract

## Context

Backlog audit coverage: CHK-6, INV-2, INV-7. See [PRD](../docs/prd.md) and [audit](AUDIT.md).

## Scope

- Record the gate credential and offline trust decisions before implementing signing.

## Out of scope

- Work outside the stated contract; consuming screens and launch operations remain in their linked tickets. No product implementation is part of this audit.

## Acceptance criteria

- [x] Record an owner-approved decision on QR URLs: the PRD says an IV link, while the proposed signed /p route is read-only. Update the contract or PRD explicitly; do not silently grant RSVP editing from a pass.
- [x] Approve snapshot maximum age, device/session expiry, lost-device response, clock-skew allowance, and stale revocation wording. Disconnected devices cannot learn new revocations immediately.
- [x] Specify what RSVP party-size edits and reissues do to previously signed passes, and how staff handle excess admissions from disconnected devices.

## Test plan

- Manual: review a decision table covering fresh/stale snapshots, revoked/reissued passes, expiry, changed party size, and two disconnected scanners. Capture the named owner and decision date; unresolved choices keep the ticket open.
- Gate: `pnpm verify`; UI work also records the design checklist at 375/768/1280 in every theme.

## Files likely touched

- docs/decisions/; docs/prd.md

## Notes / decisions

- 2026-10-21 — Added by HARNESS-002. All criteria describe future work; no completion or human approval is implied.
- 2026-11-01 — Proposal drafted in [ADR 0020](../docs/decisions/0020-gate-pass-credential.md). Nothing is approved yet. The owner approves or changes each row below, then the ADR moves to Accepted and the PRD journey wording is amended.

### Decision table (approved by the owner, 2026-11-01)

| #   | Case                                       | Proposed result                                                                                      | Owner decision |
| --- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------- |
| 1   | What the QR encodes                        | Read-only `/p/<signed-pass>`. `/i/<token>` stays the only RSVP editor and is never put in a QR.      | approved       |
| 2   | Fresh snapshot, valid pass, seats left     | Green: name, party size, table. Staff admit a count.                                                 | approved       |
| 3   | Stale snapshot (no refresh for 30 min)     | Scanning continues. An amber banner shows "Guest list last updated N min ago". Green results add the age line. | approved       |
| 4   | Snapshot refresh interval                  | Every 5 minutes while online, and immediately after a revocation, reissue or admission.              | approved       |
| 5   | Revoked after the device's last refresh    | Shows green on that device until it refreshes. This is an accepted, trained limitation.               | approved       |
| 6   | Reissued pass (old `token_version`)        | Red, "Replaced pass". Staff ask for the new pass.                                                    | approved       |
| 7   | Party size changed after the pass was sent | The pass stays valid. The allowance comes from the snapshot, and no reissue is needed.               | approved       |
| 8   | Valid signature, not in the snapshot       | Amber, "Not on this device's list yet". Staff admit after a name check, and the entry is flagged on sync. | approved       |
| 9   | Device and session expiry                  | 06:00 the day after the event (venue time zone). The snapshot is wiped, and unsynced events are kept until uploaded. | approved       |
| 10  | Lost or stolen device                      | Admin revokes the device. No key rotation is needed (it holds the public key only). The snapshot holds no phone numbers, emails or dietary notes. | approved       |
| 11  | Clock skew                                 | Reject passes issued more than 10 minutes in the future. Store device time and server receive time separately. | approved       |
| 12  | Two offline scanners admit the same seats  | The server accepts both admissions, flags a double entry for the admin scan log, and staff escalate rather than challenge. | approved       |

Owner: unclechenna · Decision date: 2026-11-01 · All 12 rows approved as proposed ("approved", in session).

- 2026-11-01 — Owner approved every row. ADR 0020 moved to Accepted. PRD Journey 1 step 5 and the Security section now say the QR is a read-only pass that is separate from the RSVP link.

## Activity log

- 2026-10-21 — new → todo — divine
- 2026-11-01 — todo → claimed — unclechenna (claude)
- 2026-11-01 — todo → in_progress — unclechenna (claude)
- 2026-11-01 — in_progress → in_review — unclechenna (claude)
