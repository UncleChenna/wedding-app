# Ticket

Ticket: TICKET-131

# Summary

Add one real guest journey regression spanning invitation, RSVP, companion details, pass downloads, returning edits and wedding-day lock. The user-approved dedicated CI job now runs the journey against PostgreSQL; this remains draft pending actual CI results.

# Changes

- e2e/guest.spec.ts exercises actual server writes and checks persisted reply/history, real signed read-only pass, image/PDF downloads and stale-form lock rejection on mobile and desktop.
- scripts/test-guest-journey.ts creates ephemeral signing keys and runs both projects with one worker.
- Guard fixture setup against non-test settings; retire only test-created invitation IDs without deleting immutable history.
- Applied the exact approved job from docs/reviews/TICKET-131/ci-proposal.md to .github/workflows/ci.yml.

# Acceptance criteria and evidence

Local production journey passes both projects (2 tests,3.9s); dev run passes2tests13.5s. CI acceptance remains incomplete until the dedicated PostgreSQL-backed job passes.

# Verification

Quick gate, production build and full pnpm verify pass. Full browser gate:769pass165skip4.9minutes. Dedicated journey ran separately; no silent CI coverage claim. Logs: artifacts/TICKET-131/{first-browser,production-browser,quick,build,full-verify}.log. Dev server emitted existing cached metadata URL serialization warnings; production run passed.

# Risks and rollout

No product behavior or schema change. Requires isolated local PostgreSQL and process-only ephemeral signing keys. Proposed CI job adds hosted runner time, no new service account or secret. Fixture setup refuses non-journey event settings; run one worker because event settings are singleton. Existing physical-device and performance release gates remain. Rollback removes the new spec/runner and proposed CI job after it is approved.

# Screenshots / UI checklist

N/A: test automation only; no changed UI.

# Harness changes

The user explicitly approved the dedicated CI job on 2026-11-03. It is applied; existing jobs and permissions are unchanged.
