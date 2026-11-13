# TICKET-112 handoff — 2026-11-13

Owner divine; agent codex; branch TICKET-112; draft PR184.

Implementation and browser coverage are pushed through ca6c9f06. The current integration uses develop `227527b7` (including the merged invitation editor). Optional staff notification controls, authenticated subscriptions, independent push outbox, VAPID transport, strict endpoint policy and generic worker notifications are implemented. The original unmerged push migration was regenerated as `0037_staff-push.sql`; its SQL is byte-identical to the original. Develop migrations 0035 (Wi-Fi) and 0036 (invitation design) and their snapshots remain unchanged. A fresh isolated database on reserved port 36401 passed the full migration history twice with identical counts, all 29 RLS checks and all four push persistence tests. Previous native database data remains preserved. The generated lockfile is authorized. Four isolated DB cases,19 focused tests, quick checks and integrated production build pass. Four headed browser cases pass across themes and mobile/desktop. Screenshots are ignored artifacts/TICKET-112. Independent final review found no remaining code issue.

External transport is NOT verified: one disposable Chromium profile registered with FCM without observing receipt; a fresh Chrome attempt timed out registration after45s. DevTools injection verifies the real worker/Notification API only, not provider transport. Original subscribed-context/new-order criterion remains open. Physical installed iOS remains a release check.

Next: implement/run a persistent-profile end-to-end provider journey, subscribe through the authenticated board, enqueue a synthetic order and drain the real push channel. Assert the notification appears; do not count HTTP acceptance or CDP injection as delivery. Use only this ticket’s disposable database. The private temporary cluster path is .harness/temporary-postgres-path, port36401; old provisional cluster path is preserved separately. No production data was touched. Linux native-notification browser tests need Xvfb; runner intentionally uses headed Chromium.

Integration validation is limited to the migration history and four database cases so far; the earlier browser/build evidence above predates this base update. The PR remains draft because actual provider delivery is unverified.

The first integration commit attempt stopped in ticket validation before lint/types: the moving develop baseline incorrectly demanded newly merged TICKET-238. TICKET-246 tracks this harness repair. No verification rule was bypassed; the staged integration remains intact. The new isolated database is stopped with its data preserved.

The authorized narrow integration carries only the unchanged merged TICKET-238 definition to satisfy the existing validator while TICKET-246 repairs that race. Its content and metadata are byte-identical to develop; no TICKET-238 implementation is imported separately. Normal hooks remain required.
