# Ticket

TICKET-121

# Summary

Positive guest journeys now fail automatically if they emit a console error, an uncaught browser error or any non-input layout shift. A context-wide fixture retains failures across navigation and popup closure, so leaving the offending page cannot erase evidence.

# Changes

- Add reusable `test`/`expect` exports in `e2e/fixtures.ts` and a guest-route observer.
- Apply the fixture to the existing real invitation/RSVP/pass journey and a positive table/menu/order-receipt journey in the existing CI runner.
- Add explicit negative-proof invocations for console, page errors and genuine CLS; ordinary runs skip these deliberate failures.
- Attach only static issue categories, normalized route labels and numeric shift values. Never attach console text, guest names or private URLs.

# Acceptance criteria and evidence

Three deliberate faults each fail at fixture teardown after the offending popup navigates away and closes. The measured non-input layout shift is0.005274434438180105 and is rejected without a tolerance. Browser recent-input exclusions remain the standard CLS definition.

The guard covers positive guest journeys importing this fixture. Expected-error/404/fault-injection suites are intentionally separate; staff routes (including the staff-only `/gate-recovery`) are excluded. Guest `/offline` is included. Future positive guest specs should import from `./fixtures`, including their context-created pages.

# Verification

- Production build and typecheck:pass.
- Real mobile/desktop invitation and ordering journeys:4passed7.8s.
- Negative proof command:3expected failures, each showing its injected issue category; proof logs summarized in `docs/reviews/TICKET-121/verification.md`.
- Independent review found no blocker; its guest offline-path coverage note is addressed. Quick and required hosted CI pending.

# Risks and rollout

Draft until TICKET-116 merges and the integrated base is verified. This introduces no product-code, dependency or CI-workflow change; the existing guest-journey lane calls the extended runner. Synthetic database fixtures only; retained order evidence is not deleted. Full physical-device/release QA remains separate. Exact-zero enforcement may reveal existing intermittent layout bugs; those must be repaired rather than hidden by a threshold.
