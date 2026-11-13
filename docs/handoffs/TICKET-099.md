# TICKET-099 handoff

2026-11-13, divine, branch TICKET-099. In progress.

Implemented admin design form/navigation, existing-service upload, private blob preview, authorized versioned saving, singleton RLS-enabled additive migration 0035, and selected-only public image delivery. No production migration application.

Verification: quick checks pass (lint/types, 185 related tests); eight additional action tests pass. Four isolated database tests pass; migration applied twice, two seed runs and row-count comparison completed before quick verification. Independent source review found no blocking authorization/concurrency issue. Published images may remain cached after replacement; public origin selection is not retroactive revocation.

Remaining: integrate TICKET-038 after merge, render its stock hero in the editor, connect saved wording/photo to private guest invitations, run real authenticated admin/guest browser flow and UI evidence, final review/PR readiness. Draft work is not acceptance completion.

Progress: private guest invitations now read saved headline/subline. Twenty-six related tests and the production build pass, plus four public-photo handler tests. The real mobile email/TOTP journey exercised invalid upload, private upload, explicit publication, stale concurrent save rejection, reload, and saved wording on the guest page. It reaches the expected remaining failure: the guest photo is not yet rendered before TICKET-038 integration. The test retains that assertion. Browser evidence is not yet a pass.

Native PostgreSQL29221 was stopped with its data preserved at /tmp/TICKET-099-postgres.Cw4tTl. The full own Supabase startup timed out; a minimal own stack (database/Auth/Kong/PostgREST/mail) starts successfully. Other stacks untouched. Credentials are read into the runner environment from this exact project's status, not printed or manually written. Runner requires matching managed local Auth/database identity.

Editor refinement: added the actual attributed stock-photo preview, exact responsive image sizes, saved-photo metadata for the incoming hero contract, read-only fields while a save is pending, and extra clearance for the fourth phone-navigation row. The real mobile editor passes axe in all four current palettes; screenshots are under artifacts/TICKET-099/mobile. Guest photo remains the one expected unimplemented assertion until the hero dependency merges. No further identical test rerun is needed before that integration.

Final integration: commit `334e4cbe` incorporates develop `21722cb9`. Migration regenerated as0036; develop 0035unchanged. Owned synthetic reset, repeat migration, all 28RLSchecks and fourDBtests pass. Real375/1280 MFA→upload→save→stale-write rejection→reload→keyboard save→guest photo/wording journeys pass. Eight all-theme axe scans pass. Source reviewed independently; evidence in docs/reviews/TICKET-099/verification.md. Next: commit final evidence, t:pr197, address known upstream242 CI repair, then exact-head review/merge.
