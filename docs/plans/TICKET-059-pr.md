# Ticket

Ticket: TICKET-059

# Summary

TICKET-059 replaces the signed-in gate placeholder with an explicit camera start/pause flow. QR decoding is separate from admission: the page says “QR read” and explains that check-in confirmation is not available yet. TICKET-060 owns result handling, and later admission tickets retain their authorization and audit requirements.

# Changes

- Live gate-role and device-session checks remain ahead of camera rendering. Anonymous, wrong-role and revoked sessions cannot open this screen.
- Rear-camera preference, permission recovery, conditional torch and cleanup on pause, hidden page and unmount. Late permission, playback and decoder completions cannot revive a stopped session.
- Native BarcodeDetector has a bounded 200ms capability/detection attempt; lazy approved ZXing fallback reads actual video pixels. Native empty frames may also invoke fallback.
- Repeated reads of each code are suppressed for three seconds, including alternating-code cases. Raw decoded credentials are neither rendered nor logged.
- Denied permission offers truthful interim manual check-in help. TICKET-063 explicitly owns replacing this destination with authenticated primary/tag-along name search and the same logged admission flow, including offline recovery. CHK-4 remains mandatory; its release-journey dependencies are unchanged.
- CI now runs real video-pixel decoding in Chromium/WebKit and the authenticated scanner journey after the existing invitation journey. Existing assertions and gates remain intact.

# Acceptance criteria and evidence

- Actual QR pixels: four Chromium/WebKit default/forced-fallback cases pass. Each holds the same QR in view and checks two deliveries at least 3,000ms apart; stream tracks stop afterward.
- Camera recovery and keyboard help: signed-in mobile/desktop journey passes, including denied permission, retry, real pixels, stop cleanup, and denied anonymous/wrong-role/revoked sessions.

# Verification

- Forty focused camera/throttle/native-fallback unit tests pass. Camera helper coverage is 96.8% lines and 95.94% branches. A focused-only coverage invocation intentionally reports other critical files untested; full suite passes 1,477 tests with 170 opt-in skips; aggregate critical coverage is 97.9% lines and 98.2% branches, with every critical file meeting the gate.
- Production build passed on integrated develop7250e483. Combined develop517805c1 (coverage, admin journey, RLS and realtime) is integrated. Hosted run42652111655 passes all seven jobs at source head2a612185, including Linux Chromium/WebKit camera pixels and actual staff/admin journeys. Final metadata-head CI is rechecked before merge.
- Local route tests used a fresh isolated PostgreSQL16.14 database and the unchanged migrations, with synthetic staff fixtures and actual PIN sign-in. This is not Supabase Auth/realtime or PostgreSQL17 certification. Database stopped, synthetic data preserved.
- Earlier integrated local runs failed with varying wall-clock timeouts while macOS power logs recorded deep/maintenance sleep. The unchanged suite passes in52.57s with command-scoped `caffeinate -is`; no test timeout or assertion was relaxed.
- Independent reviews found and fixed abort/torch races and an absent-local-environment-file assumption in CI. Regression assertions and database target safeguards remain intact.

# Screenshots

Screenshots: `docs/reviews/TICKET-059/mobile/` and `desktop/`, ready and permission-denied states. All four were visually reviewed.

# UI checklist

- PASS: token-based colours/typography/shared buttons, restrained layout, readable staff text and immediate camera-state feedback.
- PASS: four themes × ready/denied × mobile/desktop axe scans, 16 scans total.
- PASS: no overflow at 375/600/768/1280px; 44px controls; keyboard start and help focus; reduced motion.
- PASS: hard-reload CLS0 on both route projects; video space reserved. No new photographs or font loading.
- N/A: guest-page sharing and Lighthouse target; this is a staff camera screen. No QR output design changed.
- NOT VERIFIED: real iOS/Android cameras, physical torch support, printed/on-screen code scanning on two phones. These remain release requirements under TICKET-114/TICKET-163/TICKET-201, not simulated-device passes.
- Deferred to TICKET-060: valid/used/invalid admission feedback and supported sound/vibration. Decoding alone never displays a successful admission.

# Review steps

On the isolated synthetic staff database, build then run `pnpm exec tsx scripts/test-scanner-journey.ts`. Run `pnpm exec playwright test --config scripts/camera-verification.config.ts` for both real-pixel browser engines. Inspect screenshots and the explicit non-admission copy. Do not enter real guest credentials into fixture tests.

# Risks and rollout

No schema, production database, RLS or real-message changes. The generated lockfile adds the ticket-approved ZXing dependency. Camera permission is requested only on an explicit action. Reverting this ticket restores the signed-in placeholder without changing credentials or admission data. Real-device release gates remain outstanding; this camera foundation alone is not a complete operational gate.

Ticket: `tickets/TICKET-059-build-the-scanner-page-with-camera-qr-reading.md`.
