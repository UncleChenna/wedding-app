---
id: TICKET-206
title: Verify admin MFA on physical iOS and Android before release
epic: data-auth
status: todo
priority: urgent
estimate: S
labels: [human, test, security]
module: admin
owner: ""
agent: ""
blocked_by: []
blocks: [TICKET-154, TICKET-176]
branch: ""
pr: ""
created: 2026-10-31
updated: 2026-10-31
started: ""
completed: ""
reason: ""
resume_to: ""
---

# TICKET-206: Verify admin MFA on physical iOS and Android before release

## Context

See [admin MFA evidence](../docs/reviews/TICKET-030/README.md) and [PRD](../docs/prd.md).

On 31 October 2026 the user approved merging TICKET-030 / PR54 after passing CI and tracking physical-device MFA QA separately. Automated Auth/TOTP, all-theme QR decoding and browser keyboard tests passed; these are not physical-device evidence. This ticket blocks invitation and full production release (TICKET-176 and TICKET-154).

## Scope

Verify admin MFA enrolment and returning sign-in on a physical iPhone and Android phone, including scanning with actual authenticators, manual setup fallback, code entry, keyboard visibility and recovery messaging. Record device, OS, browser, authenticator versions, build SHA and date.

## Out of scope

Changing recovery policy, removing AAL2 enforcement, or claiming emulation proves physical-device behavior. Split discovered code defects into linked tickets.

## Acceptance criteria

- [ ] On each physical platform, scan the rendered enrolment QR with an authenticator and successfully verify a generated code; no secrets are retained in evidence.
- [ ] Manual-key fallback and returning sign-in succeed on both platforms; incorrect/expired codes remain rejected.
- [ ] Native keyboards leave inputs, errors and submit actions visible and operable; focus and 44px targets are checked.
- [ ] All four themes preserve readable instructions and scannable QR output on both platforms.
- [ ] Update TICKET-030's UI review with device/build evidence; unresolved failures block production releases TICKET-176 and TICKET-154.

## Test plan

Manual: use disposable authorized admin accounts on a nonproduction deployment. Exercise enrolment, sign-out, returning MFA, wrong code and manual setup on iOS and Android. Save redacted screenshots and a versioned result matrix. Re-run automated MFA regressions if code changes.

## Files likely touched

docs/reviews/TICKET-030/README.md; docs/reviews/TICKET-206/; docs/handoffs/TICKET-206.md.

## Notes / decisions

User approval allows the implementation merge, not release approval or bypassing physical checks.

## Activity log

- 2026-10-31 — new → todo — divine — approved physical-device follow-up for PR54
