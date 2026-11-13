# Ticket

TICKET-238

# Summary

A camera read taking longer than the three-second duplicate-frame throttle could be aborted and repeated after the server had already logged its observation. Keep one read active per capture session so repeated frames cannot create duplicate observations.

# Changes

- Ignore decoded frames while the capture's read is pending; explicit pause/restart still cancels and fences stale responses.
- Add deferred-response tests covering duplicate frames, cancellation, restart and unmount.
- Extend the real signed-camera matrix with an opt-in four-second response delay after the server logs the read; retain all existing observation/admission assertions.
- Add TICKET-238 as a production release prerequisite.

# Acceptance criteria and evidence

The new unit regression fails before repair (three resolver calls instead of one), then passes. The stale-response test now begins the newer capture with actual Pause/Open actions; all original stale-result and privacy assertions remain.

# Verification

- Focused scanner/live-update units:16 pass.
- Production build:pass.
- Actual mobile/desktop delayed-response matrix:2 pass in18.0s; first response held4seconds after server logging, exactly one observation per verdict, no new admission.
- Independent source review: no blocker; required hosted CI pending.
- Integrated develop5c60dda9 with the merged TICKET-242 CI repair. The only conflict was the release dependency list: retain current develop’s consolidated list and add238. Independent review confirms no current prerequisite was removed; scanner source and delayed-response assertions are unchanged. Fresh integrated checks remain pending.

# Risks and rollout

No schema, credential, admission or offline queue changes. While a read is pending, an operator can pause and start a new capture instead of having another frame silently replace the pending request. No timer or assertion is weakened. Physical device QA remains separately required; this test uses synthetic camera pixels and an isolated database.
