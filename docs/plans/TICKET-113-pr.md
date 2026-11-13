# Ticket

Ticket: TICKET-113

# Summary

The saved guest pass browser test was opt-in locally and absent from CI. It now runs on mobile and desktop in the existing guest job. A new smoke test checks the actual application through HTTPS, manifest/installability diagnostics, worker control and offline navigation; docs map existing scanner and update coverage to their gates.

# Changes

- Generate and public-key-pin a disposable loopback TLS certificate; never trust arbitrary invalid certificates or change production TLS.
- Exercise emulated standalone display and real offline navigation; keep native installation separate.
- Make the existing offline-pass fixture safe for both managed local worktrees and disposable hosted CI, preserving its local database guard and all prior assertions.
- Track settings ownership using INSERT RETURNING and clean only inserted fixture settings.
- Run both browser projects with ephemeral signing keys, and place images in this ticket's ignored artifact directory.

# Acceptance criteria and evidence

Actual local HTTPS test passes: secure context, zero browser manifest/installability errors, worker control and themed offline navigation. Both existing offline-pass browser projects pass (11s/9s) against this ticket's migrated native PostgreSQL. Original scanner and N/N+1 tests remain in their existing CI jobs. TICKET-111 is merged with all CI checks passing; integration uses develop 979609e6 and preserves both the update-prompt and reviewed-recovery documentation.

# Verification

Production build and focused lint passed. Independent review identified setup cleanup and fixture ownership improvements; both addressed. Final rerun after those fixes passes: two offline-pass projects (16.2s/10.9s), HTTPS smoke (1.2s), quick lint/types and two CI-parity tests. After resolving the sole documentation conflict, the integrated production build passes; HTTPS smoke passes (0.9s), offline-pass mobile/desktop pass (14.0s/16.2s), all-theme update-prompt browser checks pass (11.5s/8.5s), and 15 update-client/prompt tests pass, including rejection of reload while retained attempts remain. The previous hosted run `43388307715` failed the desktop offline-gate journey: the repeat-scan verdict was absent on the first attempt, and the retry retained 50 pending events instead of zero. The separate camera lane passed. This failure remains unresolved; TICKET-239 is collecting diagnostics. Current integration uses develop `97e67cd2`, including TICKET-237’s bounded transfer diagnostics and TICKET-014’s matching generated icons, without changing scanner assertions. After integration, quick lint/types, 295 related unit tests and both CI-parity checks pass; nine opt-in database tests are skipped. Fresh hosted CI is required; no local database or production rebuild was repeated for this conflict-free base update.

# Risks and rollout

Tests only; no product, schema or dependency changes. OpenSSL is required for the local TLS fixture and is present on the tested macOS/hosted Ubuntu environment. Browser certificate pinning is scoped to the disposable test process. No real phone installation or deployed-domain certificate is certified; TICKET-114 and release gates remain.

# Screenshots

No product UI change. Existing offline-pass checks write synthetic review captures to `artifacts/TICKET-113/offline-pass/`.

# UI checklist

N/A: test coverage only, no product UI/styling changes.

# Harness changes, if any

Adds one existing-runner step to the guest CI job and a smoke-tagged HTTPS case. No existing checks removed, skipped or weakened. Full verification remains required before release.
