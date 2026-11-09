# checkin

Gate check-in: staff scan guest QR codes with the phone camera. Must work offline: queue scans on the device with a `client_event_id` and sync idempotently (`check_ins`). Routes: `src/app/(staff)/checkin`.

Gate passes (ADR 0020, ADR 0021):

- `lib/gate-token.ts`: the format-1 pass encoding and WebCrypto verification with strict JavaScript fallback. It's shared with scanners, so it has
  no Node or server imports.
- `server/signing.ts`: Ed25519 signing and key ring loading. This is the only reader of the private key.
- `server/public-keys.ts`: the `GET /api/gate-keys` response.
- `lib/pass-url.ts`, `lib/pass-eligibility.ts`, `server/pass-repository.ts`, `server/resolve-pass.ts` and
  `components/gate-pass.tsx`: the read-only `/p/<pass>` page (TICKET-183).
  - It shows online eligibility from current server data, not admission status.
  - It never links to or reveals the `/i/` RSVP link.

- `lib/verify.ts`: scanner credential verification against a trusted staff-session/snapshot expiry deadline. Does not grant admission. Callers must enforce current snapshot version/status and allowance separately.
- `pnpm test:gate`: database-free shared Node/browser contract evidence, Chromium and WebKit, default (native attempted) and forced fallback; timings and bundle/cache checks go to `artifacts/TICKET-057/`.
