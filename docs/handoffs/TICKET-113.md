# TICKET-113 handoff

2026-11-13 — divine / codex — branch `TICKET-113`.

Draft PR: https://github.com/UncleChenna/wedding-app/pull/179

Implementation `cd09a5c7` adds real loopback HTTPS/manifest/worker/offline smoke coverage and runs the existing saved-pass browser suite in the guest CI job on both projects. Certificate trust is pinned to the disposable certificate's public key. The fixture cleans only settings rows it inserted. No product, dependency or schema changes.

Production build, quick lint/types, two CI-parity checks, HTTPS smoke (1.2s) and both offline-pass projects (16.2s/10.9s) passed locally. Independent review confirmed the resource cleanup and fixture ownership fixes; no remaining findings. The ticket's native PostgreSQL on port25961 is stopped with its data preserved.

Next: wait for TICKET-111 PR176 to merge, integrate its reviewed update-client tests and current develop into this branch, resolve documentation overlap without dropping either coverage map, then inspect hosted CI and finish acceptance evidence. Do not certify the update dependency before it merges. Actual iOS/Android installs and physical-device checks remain TICKET-114 and release gates; emulated standalone mode is not a native installation.
