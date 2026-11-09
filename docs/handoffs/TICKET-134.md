# TICKET-134 — in progress, 2026-11-09

Root is sole editor in `.worktrees/TICKET-134`, owner divine, exact branch TICKET-134.
Started after091merged530bb67b; source base includes its protected CSV page.
New134DB startup/migration is running via `pnpm db:migrate`; log
`/tmp/TICKET-134-db.log`, process28844.053 released its DB with backup:true.

Read ticket/PRD/admin scope and existing isolated OTP/TOTP, menu, staff, seating
and import browser helpers. No product/test implementation yet. See dated plan:
combined real admin journey plus separate hosted-CI local Auth/mail/database
setup, not mocked authentication. Existing `localAdminLogin` requires matching
`.harness/worktree.json`; proposed CI generator will reuse isolatedConfig and
copySupabaseTemplates with fresh hosted-runner guards and exact local credentials.
CI inherited environment defaults must be replaced with the generated local
values for migrations/build/browser execution without printing them.

PR125import and128history are merged/done (530bb67b and2d2df795). PR127scanner
8961a2ac and129reminders e2c13096 are independently reviewed; CI is pending.
No scope is complete merely because individual features passed their own tests.
