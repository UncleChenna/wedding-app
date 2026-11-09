# TICKET-108 CI coverage

Under the owner's standing authorization to make repository changes and complete verified tickets, extend two existing CI jobs without removing checks, changing secrets or weakening timeouts:

- The disposable PostgreSQL invitation journey job runs `scripts/test-offline-scanner.ts` after the existing scanner journey. It creates ephemeral test signing material and synthetic staff fixtures, then tests live PIN authentication, server-authorized offline preparation, an offline reload and enhanced sign-out.
- The Chromium/WebKit camera job also runs `scripts/scanner-shell.config.ts`: actual IndexedDB generation races, the emitted worker and generated camera bundle, expiry/track shutdown, missing assets, native POST sign-out, every theme's layout/axe, full browser restart and failed-invalidation recovery. Failure artifacts include the new scanner folder.

Local evidence: 46 combined Chromium/WebKit tests pass in36.4seconds; authenticated production journeys pass2/2 in4.1seconds against the owned native PostgreSQL fixture. CI remains required on the final PR head; local success is not a CI claim. Native PostgreSQL evidence does not certify Supabase Auth/Realtime. No production database application is included.
