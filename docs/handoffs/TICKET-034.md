# TICKET-034 — Event defaults and launch pass scope

2026-10-26 · divine · codex · `TICKET-034`

The owner approved one tag-along by default (editable per invitation), an RSVP edit lock at midnight on 19 December 2026 in the venue's time zone, and retention for 90 days after the wedding. After explanation, the owner explicitly chose to defer Apple/Google Wallet and launch with QR, saved image/screenshot and PDF. The existing offline-pass requirement remains. Couple: Uchenna and Adaora.

The owner answered TBD for venue, ceremony time, time zone, dress code and map. These remain unknown. No UTC cutoff or production zone is guessed. TICKET-101 can save draft details but requires an explicit zone before live activation; TICKET-042 rejects missing-zone lock configuration; TICKET-176 requires real details before first send. This decision enables implementation without claiming release readiness.

PRD/current-state assumptions, Wallet traceability and downstream settings/lock/privacy/retention/release ticket notes are updated. The signed-pass requirement remains in the PRD; exact URL/payload/revocation design stays with TICKET-056 rather than being attributed to the owner.

Quick and full verification passed before integrating PR #38: 266 unit tests, production build, 163 browser passes and 17 conditional skips. Final post-rebase PR verification remains pending. No live settings, accounts, messages or deletion changed; UI/device checks are N/A for documentation.

Rebased onto allocator merge `140acb7b95721e1b88a76c8b68ff33affbe4ee64` without source conflicts. Next: run t:pr, record final verification results, mark the draft ready and check required CI on its exact final head before the authorized merge.
