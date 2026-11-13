# TICKET-112 handoff — 2026-11-13

Owner divine; agent codex; branch TICKET-112; draft PR184.

Implementation and browser coverage are pushed through ca6c9f06. Integrated base is develop6b2c9d3e. Optional staff notification controls, authenticated subscriptions, independent push outbox, VAPID transport, strict endpoint policy and generic worker notifications are implemented. Migration0035 and generated lockfile are authorized; all28 tables retain RLS after two migration runs. Four isolated DB cases,19 focused tests, quick checks and integrated production build pass. Four headed browser cases pass across themes and mobile/desktop. Screenshots are ignored artifacts/TICKET-112. Independent final review found no remaining code issue.

External transport is NOT verified: one disposable Chromium profile registered with FCM without observing receipt; a fresh Chrome attempt timed out registration after45s. DevTools injection verifies the real worker/Notification API only, not provider transport. Original subscribed-context/new-order criterion remains open. Physical installed iOS remains a release check.

Next: implement/run a persistent-profile end-to-end provider journey, subscribe through the authenticated board, enqueue a synthetic order and drain the real push channel. Assert the notification appears; do not count HTTP acceptance or CDP injection as delivery. Use only this ticket’s disposable database. The private temporary cluster path is .harness/temporary-postgres-path, port36401; old provisional cluster path is preserved separately. No production data was touched. Linux native-notification browser tests need Xvfb; runner intentionally uses headed Chromium.
