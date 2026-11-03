# Ticket

Ticket: TICKET-131

# Summary

Add one real guest journey regression spanning invitation, RSVP, companion details, pass downloads, returning edits and wedding-day lock. The user-approved dedicated CI job now runs the journey against PostgreSQL; both projects passed in CI.

# Changes

- e2e/guest.spec.ts exercises actual server writes and checks persisted reply/history, real signed read-only pass, image/PDF downloads and stale-form lock rejection on mobile and desktop.
- scripts/test-guest-journey.ts creates ephemeral signing keys and runs both projects with one worker.
- Guard fixture setup against non-test settings; retire only test-created invitation IDs without deleting immutable history.
- Applied the exact approved job from docs/reviews/TICKET-131/ci-proposal.md to .github/workflows/ci.yml.

# Acceptance criteria and evidence

Local production journey passes both projects (2 tests,3.9s); dev run passes2tests13.5s. CI acceptance passed in run41732191620/job126252318493 on27e54fb:2tests7.4s, mobile and desktop.

# Verification

A later full review rerun exposed7existing keyboard failures: tests pressed Tab on a streamed loading shell before links existed. Added an explicit visible heading assertion before the existing checks; all26affected tests now pass in1.2minutes under the same database-outage conditions. No assertions/timeouts/retries removed or weakened. Final full rerun pending.

Quick gate, production build and full pnpm verify pass. Full gate:852unit55skip;769browser165skip4.9minutes. Dedicated journey ran separately; no silent CI coverage claim. Logs: artifacts/TICKET-131/{first-browser,production-browser,quick,build,full-verify}.log. Dev server emitted existing cached metadata URL serialization warnings; production run passed.

# Risks and rollout

No product behavior or schema change. Requires isolated local PostgreSQL and process-only ephemeral signing keys. Proposed CI job adds hosted runner time, no new service account or secret. Fixture setup refuses non-journey event settings; run one worker because event settings are singleton. Existing physical-device and performance release gates remain. Rollback removes the new spec/runner and proposed CI job after it is approved.

# Screenshots / UI checklist

N/A: test automation only; no changed UI.

# Harness changes

The user explicitly approved the dedicated CI job on 2026-11-03. It is applied; existing jobs and permissions are unchanged.
