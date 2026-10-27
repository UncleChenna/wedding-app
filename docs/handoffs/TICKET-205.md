# TICKET-205 handoff — 2026-10-27

Owner divine; agent codex; branch TICKET-205. Verified base647b7dc07b1836ac6a2337f35d8848e98b5e885d. Managed project wedding-a14e2552dd1c, DB25881/app25890/browser25891.

## Outcome

Migration configuration, seed and counts/RLS commands now validate their effective database URL before constructing a client. A shared scripts/database-target.ts guard checks managed path, project/config identity, reserved port, loopback host and postgres database. Query overrides/fragments are rejected in managed mode; linked checkouts missing metadata fail closed. Errors never echo the URL. Primary checkout/deployment migration and checks retain configured remote targets; seed stays local-only.

No schema, migration, dependency or CI changes. This guards against accidental targets; developer-controlled metadata is not a security boundary. Application runtime database connections are outside this command-focused ticket.

## Evidence

- Red:16 identity assertions failed with a no-op guard. All3 subprocess command regressions failed before wiring the guard (seed/counts reached an inert test socket).
- Green:19 identity tests +3 command tests pass. Each real entrypoint exits1 with sanitized refusal and zero connections to the listening wrong target, including a shell URL overriding a correct fixture .env.local.
- pnpm verify:quick passes.
- pnpm verify passes:386 unit tests,10 opt-in DB skips; production build;287 browser tests,103 conditional skips,no retries; format/lint/types/ticket validation pass.
- Correct isolated startup, db:migrate, db:counts and db:check-rls pass. Ten empty public tables;2 applied migrations; RLS enabled on all10. No seed/reset/data deletion performed.

## History and next action

Initial status commit was blocked by missing TICKET-204 definition. User explicitly requested PR43 merge; it merged as647b7dc after full CI. This branch fast-forwarded to that base, then status commit4c0234f was pushed. The gap is resolved without copying another ticket definition out of its branch or skipping hooks.

Push implementation and open the detailed PR through t:pr. Require final-head CI before any merge. TICKET-006 must still repeat correct-target concurrent database and cleanup proof after this guard is integrated; its earlier primary-port migration result does not count as isolation proof. Other migration tickets retain their separate pending approvals.
