# Verification — TICKET-121

2026-11-13. Worktree base develop fe97f5f8; isolated native PostgreSQL33841.

- `pnpm typecheck`:pass.
- `pnpm build`:pass.
- `RUN_GUEST_QUALITY_PROOF=all pnpm exec playwright test e2e/guest-quality-proof.spec.ts --project=mobile --workers=1`: exits1 with exactly3deliberate failures. Each fails in the fixture's `quality.issues` assertion after the offending popup navigates and closes. Reported kinds are `console.error`, `pageerror`, and `layout-shift`; the latter has value0.005274434438180105 on `/invite`.
- The shift proof independently observes a positive non-input shift before asserting fixture rejection. It waits700ms before mutation so the browser's recent-input grace period cannot invalidate the proof. An earlier too-early mutation produced no qualifying shift; it is not counted as rejection evidence.
- `pnpm exec tsx scripts/test-guest-journey.ts` with this worktree's database:4passed7.8s. Both projects exercise real table selection/menu/order receipt and the existing open/accept/companion/meal/pass-image/PDF/return/edit/lock journey. The default context and created pass tab are observed.

No guest text, private link, pass token or console message body is included in quality attachments. Staff routes and intentional application-error journeys are outside this positive-path fixture's scope. Unsupported layout-shift observation or a missing observer fails closed.

Review follow-up: the public entry flow also visits actual `/invite`, `/lost-link` and `/offline` before ordering. The shared route registry classifies `/gate-recovery` as staff, so it remains intentionally excluded. The reviewer found no blocker.
