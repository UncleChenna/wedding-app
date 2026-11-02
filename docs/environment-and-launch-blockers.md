# Environment and launch blockers — revised mandate

## Local development

Use Node24/pinned pnpm and a claimed managed worktree. TICKET-211 uses its own Supabase project/ports from ignored `.harness/worktree.json`. `pnpm wt:new TICKET-211` completed after starting the already installed Docker app. Local migrations/fixtures are not production operations. `pnpm db:start` regenerates only managed local values without displaying them; never inspect/commit `.env.local`. Run local scripts from the ticket worktree so target guards remain effective.

## Required environment

The public example documents DATABASE_URL, LOG_LEVEL, the canonical public site URL, Supabase API/publishable key, private admin allowlist and gate signing key ring. Hosted values/credentials are not verified here. Keep database/signing/provider secrets server-only and in the operator's secret store. Production requires HTTPS, separate staging/production Supabase data, allowlisted admins, configured Auth email and TOTP, a verified signing key/rotation procedure and scoped operational access.

## External or product blockers

- Owner-approved staging/hosting/domain/cloud-backup resources and access. No new account, paid tier, deployment, public launch or audience change has been created.
- Final event date/time/venue time zone/event end and actual content. Preserve configured values, not prototype dates; unknown fields display TBA in future content UI. Event-end anchor and one-year expiry jobs/holds/backups remain incomplete.
- Design reference is behind ChatGPT sign-in; exported design source/assets or owner-authenticated access is needed for fidelity. The copied portrait is preserved; no faces were regenerated.
- Hosted authentication, real iOS/Android/WhatsApp/camera/install/TOTP, venue weak-network and staff rehearsals remain required.
- Guest sessions/revocation, staff individual roles/grants, member UI and approvals, check-in/seating, stock/orders/waiter/alcohol, durable in-app notifications and provider integration are not complete. Check the requirements matrix; do not infer delivery from data structures.
- Migration source is locally generated/tested, but the existing repository hook requires a human's exact-path approval record for changed drizzle files before the full gate/commit can pass. Do not disable hooks or fabricate this authorization.

## Staging/release sequence

Choose an owner-private staging target, provision separate synthetic data/Auth configuration, protect secrets and verify backup restoration into a new target. Apply reviewed schema before app code, run the integrated synthetic flows and record exact commit/host. Enable no real sending during rehearsal. Only an explicitly authorized owner decides audience expansion and live sends after technical and operational gates pass. A local build is not private staging and is not wedding readiness.
