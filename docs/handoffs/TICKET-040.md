# TICKET-040 — 29 October 2026

Owner divine; agent codex; branch TICKET-040; base develop f7e8fac048514058030d28d7b3a61f168de014f9. Start97e47ab pushed. In progress, not complete.

Implemented validated yes/no Server Action, transaction-locked published invitation check, one-row RSVP upsert plus invitation status, approved warm confirmation and reload state. A small useActionState form uses a permalink for native no-JavaScript submission. Missing venue timezone keeps live replies closed; the test fixture timezone is explicitly Etc/UTC, not an event decision. Tag-alongs, edit cutoff and audit history remain041/042. No migration/RLS/new dependency.

Five isolated database tests passed: yes/no/count/status consistency, repeated reply upsert, unknown/malformed/draft/revoked rejection and missing-timezone activation denial. Initial service test failed on missing module; 18 related tests then passed. Types and build passed before the latest Proxy cleanup.

Browser work uncovered two real issues, separate from repeated macOS sleep interruptions. A streamed Suspense placeholder never revealed personal content without JavaScript; only this route now deliberately allows blocking with instant=false and connection(). Native POST then failed because no-referrer produces Origin:null; strict-origin strips the private path/token while retaining the origin needed by unchanged Next.js CSRF checks. Six real browser checks passed after these fixes (mobile/desktop; JS and no-JS yes/no persistence, reload, tampered tokens and revocation). Tests use allHeaders to inspect actual Origin and Referer.

Revocation's Proxy rewrite still emitted a framework action-module error, despite correctly denying mutation. Latest unverified cleanup lets POST reach its own token-validating action, retains GET existence checks, and adds a visible neutral rejection assertion. This latest change needs rebuild/browser verification; do not call the ticket complete.

Build recovery: an approval-review timeout prevented a build launch. The fallback sandbox build could not bind Turbopack's local IPC port. Elevated retry repeated the cached CSS pipeline panic. Exact-path permission is pending to clear ONLY .worktrees/TICKET-040/.next/cache/turbopack. Do not manually delete it before the answer; no source/database deletion requested. Existing TICKET-035 cache authorization was for another path.

Environment: isolated project wedding-8ba25aaf3f3c, API34920, DB34921, app34930, browser34931. Stack running. First setup from the old primary checkout omitted Auth email template; rerunning AGENT_OWNER=divine pnpm wt:new TICKET-040 inside the new worktree used the fixed generator and completed migrations. Never use the primary DB. Browser fixture event row is labelled RSVP browser test only; tests refuse to overwrite other event configuration. Fixture invitations are cleaned by tests; no real guest data used.

Next: resolve cache permission, rebuild and run RUN_RSVP_BROWSER_TESTS=1 caffeinate -i pnpm exec playwright test e2e/rsvp-live.spec.ts --project=mobile --project=desktop --workers=1. Then all-theme screenshot/axe/keyboard/44px matrix, CLS/performance, existing personal invitation integration suite, full pnpm verify and detailed final PR. Required checks remain unverified. Check final-head CI before authorized merge.

TICKET-030 is in_review with draft PR54 and full prior local/CI passes; physical authenticator QA deferral is still pending. Never merge it on the assumption that silence is approval.
