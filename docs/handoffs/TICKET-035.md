# TICKET-035 — Warm invitation wording

2026-10-26 · divine · codex · branch `TICKET-035`

The user selected Warm. The PRD records that decision; `src/modules/invitations/lib/copy.ts` exports the default voice, message templates (retaining PRD alternatives for TICKET-052), and approved on-site copy. TICKET-052 now explicitly references these exports. Placeholder rendering, settings integration, production-screen adoption and final pre-send proofreading remain downstream. No invitations were sent.

All 20 exported strings were compared with whitespace-normalized PRD text and matched exactly. Quick and full verification passed: formatting, lint, types, 251 unit tests, production build, 155 browser passes and 17 conditional skips. No rendered UI changed, so screenshots/device QA are not applicable to this copy catalogue.

Base: `fa36b007acc67b7e13eff1b07973a1bb937857d1`. Managed checkout created and dependencies installed. Its optional Supabase startup was cancelled because this copy-only task needs no database. Database startup/migrations are not claimed as verified here.

Next: finish the full gate, publish a detailed PR to develop, check required CI and follow the user's authorized merge workflow.
