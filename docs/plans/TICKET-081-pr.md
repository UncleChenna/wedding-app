# TICKET-081: enforce the order-page transfer and delivery budgets

## Problem and current work

A genuine cold visit to `/order` currently exceeds the required 200,000-byte budget. New production-browser regressions measure both the table form and a confirmed-table menu, including initial service-worker downloads. This is unfinished work: the new opt-in budget tests fail, and no optimization or delivery-time gate is claimed yet.

## Evidence

Base develop: eb14549758ac20fdb286325c7aa57ce42605b564. Production build passes. Actual local browser budget tests fail at 1,239,803 bytes (table form) and 1,227,649 bytes (menu), against 200,000. The service worker eagerly fetches full fonts referenced by offline-page CSS, including Inter236,076 and Cormorant209,428 bytes. Raw exploratory breakdown: docs/reviews/TICKET-081/cold-baseline.json. Native PostgreSQL on this worktree's reserved port was used only for synthetic table/menu data; it does not certify Realtime delivery.

## Test contract

Fresh browser context per route, normal HTTP caching within that visit, enabled service worker, actual200 response, visible form/menu, loaded fonts, completed worker installation and1.5seconds without completed requests. Encoded response body plus headers includes worker traffic; cached Chromium responses correctly sum tozero. No cache warm-up, request blocking or mocked page is used. Run RUN_ORDER_PERFORMANCE=1 with a production build and the isolated database.

## Remaining work

- Reduce actual transfer without losing offline operation or theme/readability requirements.
- Add the real authenticated board delivery test on documented slow4G settings; keep the strict under2seconds criterion.
- Wire these gates into CI with environment documentation/parity intact.
- Complete responsive/accessibility/performance review and independent source review.
- Require TICKET-075's verified completion and final successful CI before readiness.

No migration, dependency or production data change. This draft is not approval to release or merge failing work.
