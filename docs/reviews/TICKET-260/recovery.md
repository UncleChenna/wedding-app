# Development worker recovery

The browser's hydration diff showed the server's new bounded toast markup against the client's old unbounded markup. The old client also lacked `useOptionalToast`. Restarting Next and regenerating `.next/dev` did not remove the browser's production service-worker Cache Storage.

The production worker correctly uses cache-first for immutable deployment assets. Development chunk URLs are not immutable across edits. A previously installed production worker on the same origin therefore kept returning old JavaScript even though development registration is disabled.

Development HTML now runs a small static bootstrap before app hydration. It checks exact root scope and same-origin `/sw.js` ownership before unregistering. An owned controller triggers one reload per tab, bounded through session storage; blocked storage leaves manual reload available. A clean uncontrolled load clears the recovery marker. No cache, IndexedDB, pass, queue or other worker is deleted. The development worker route is network-only and does not depend on generated scanner assets. Production registration and guarded updates are unchanged.

## Verification

- Full `pnpm verify` passed; final focused worker suite: 51 passing tests, including production worker behavior and seven development cases.
- Real browser regression reproduced a cached stale JavaScript response, then recovered to current JavaScript in two document loads. Registration/controller were removed; saved offline-pass response and an IndexedDB pending-scan record remained identical.
- Actual localhost sign-in loaded successfully with the recovery bootstrap present and no browser errors; `/sw.js` returned the development network-only script.
- Independent source review identified the need for a reload bound; the session marker and regression test were added.

## Separate environment finding

The development database is reachable but has only ten public tables and no `public.event_settings` (SQLSTATE 42P01). This explains the default-theme warning; it is independent of the JavaScript crash. No database changes or resets were made. The configured database needs its migration state reviewed before applying the remaining schema migrations.
