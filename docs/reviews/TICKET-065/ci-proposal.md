# TICKET-065 CI verification

Add the isolated projection test and authenticated snapshot browser runner to the existing guest journey job, before ordering's settings fixtures. The existing disposable PostgreSQL service and production build are reused. The runner generates ephemeral signing/session material and retains only synthetic append-only admission evidence.

Add the real worker/IndexedDB suite to the existing Chromium/WebKit camera job, with its failure artifacts. It exercises the exact generated worker, multiple tabs, durable expiry, old-worker sign-out compatibility and full browser restart after failed private erasure.

No existing assertion, gate, job timeout, permission or service is removed or weakened. No production database application or new account is involved. The current user authorization covers these scoped verification changes.
