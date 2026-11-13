# TICKET-112: optional staff-board push notifications

Draft implementation; not ready to merge.

The owner’s standing authorization covers this ticket's generated `pnpm-lock.yaml`; the exact path is recorded in the ignored local approval file. No manual lockfile changes were made.

Staff boards currently need to remain visible to announce new orders. This adds an explicit notification preference for authenticated kitchen/bar devices, generic Web Push notices and fixed same-origin board links. Denying permission leaves the board usable. Guest names, order contents and dietary notes are never included in notifications.

The maintained `web-push` library performs VAPID signing and payload encryption. Credentials remain server-side; only the public key reaches an authenticated board. Subscription endpoints are restricted to known browser push-service hosts, HTTPS and standard ports; redirects are refused and the entire outbound fetch has a three-second timeout. Sources: https://github.com/web-push-libs/web-push and the installed4.0.0 package.

The existing transactional order outbox gains independent push delivery state. Device/staff revocation, role, credential version and expiry are checked before sends. Station bursts coalesce into generic notices. A15-second drain budget and per-device delivery watermark preserve unfinished work without repeatedly notifying the first device. WhatsApp and push channels run independently, so one failing channel cannot prevent the other from running.

## Evidence so far

-18 focused tests pass: endpoint restrictions, generic payloads, denied/unavailable permission, old-subscription reconciliation, fixed notification navigation and channel failure isolation.

- Lint, TypeScript,168 related tests and two CI-parity checks pass. Production build passed before the develop integration; the integrated build remains to run.
- Migration0035 was generated after integrating develop6b2c9d3e. Two applications preserve counts; all28 public tables retain RLS. Four isolated database tests pass for batching, failure retries, credential/device revocation and expired subscriptions. The provisional0033 database is stopped and preserved separately; no production or collaborator database was changed.
- Initial independent review found stale browser-only subscription state, permission prompting before configuration, and channel failure coupling. All three were corrected with regression tests.

## Remaining before review

- Actual Chromium push delivery journey, production build and all-theme staff-control review.
- Independent final review, required CI and release-gated physical installed-iOS push checks.

## Rollout

The three optional `WEB_PUSH_*` settings enable the feature as a complete set. Without them, no permission control or delivery is enabled. Use the existing authenticated alert-drain scheduler. Do not claim production browser-provider or physical-device delivery from unit tests. Disable credentials to stop delivery; boards and ordering remain available.

## Migration and rollback

Apply `0035_staff-push.sql` after develop's unchanged0033/0034 recovery migrations. This adds an RLS-enabled device subscription table and independent delivery columns/index on the existing outbox. No existing columns, policies or rows are removed. Rolling back the application can leave these additive fields in place; disable the VAPID settings to stop new sends. Do not drop retained audit/recovery data.
