# checkin

Gate check-in: staff scan guest QR codes with the phone camera. Must work offline: queue scans on the device with a `client_event_id` and sync idempotently (`check_ins`). Routes: `src/app/(staff)/checkin`.

Admission: `lib/admission.ts` decides a scan (valid, already used, invalid, revoked, not RSVP'd) and partial
admission. It's pure, so the server and the offline scanner share it. The database bound
`admission_counters_bounded` backs it up.

Offline sync (TICKET-173): `POST /api/checkin/sync` takes a gate device's batch (`lib/scan-sync.ts`).
`server/reconcile-scans.ts` stores each scan in its own transaction, so an acknowledgement always means it's saved.

- Every reported scan is kept in `scan_events`. The canonical count only takes what the allowance has left.
- A report over the allowance, or one the server would have refused, is stored with `conflict` set (for TICKET-067).
- A retried event id is a no-op; the same id with a different scan, or from another device, is rejected.
- Database tests: `RUN_SCAN_SYNC_DB_TESTS=1 vitest run scripts/__tests__/scan-sync.integration.test.ts`.

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
