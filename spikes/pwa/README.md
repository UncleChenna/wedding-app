# Service-worker prototype

Run `node spikes/pwa/verify.mjs` from this managed worktree with pnpm on PATH. The script refuses an existing `public/__pwa-spike` directory, builds baseline and prototype, runs Chromium against the production server, and cleans only its temporary files. All cached data is synthetic. The browser context is disposable; no worker registers in the product.

Decision: [ADR 0014](../../docs/decisions/0014-service-worker.md).

Measured on 2026-10-21 (one sequential warm-cache run):

```json
{
  "baseline": {
    "milliseconds": 9184,
    "staticBytes": 1373288
  },
  "prototype": {
    "milliseconds": 4817,
    "staticBytes": 1373288
  },
  "workerBytes": 1494,
  "workerGzipBytes": 643,
  "checks": [
    "production registration",
    "install precache",
    "runtime public fixture cache",
    "offline navigation",
    "offline runtime fallback",
    "private routes excluded"
  ]
}
```

No root dependencies or client bundles were added. Public prototype files are served separately; the worker size above is not a production implementation budget. Full device, root-scope privacy and update/outbox tests belong to the linked downstream tickets.
