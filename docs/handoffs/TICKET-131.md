# TICKET-131 — 2026-11-03

Owner divine; agent codex; branch TICKET-131; develop base 0e6247c630c4d8962eb01b3c8bc2ef0817268e47. Managed stack wedding-b3e2c85303e2; app21010/browser21011.

Implemented e2e/guest.spec.ts and scripts/test-guest-journey.ts. Real invitation attendance, companion name/meal, signed read-only pass, image/PDF downloads, return/edit/reload and stale cutoff rejection are asserted against synthetic local database fixtures on mobile and desktop. Cleanup retires only owned invitation IDs and preserves append-only RSVP history. Ephemeral signing keys stay in the runner process tree.

Dev journey: 2 pass13.5s (existing cached metadata URL serialization warnings disclosed in first-browser.log). Production journey: 2 pass3.9s. Quick and production build pass. Full verify passes formatting/lint/types/unit/build and769browser165skip4.9m. Dedicated journey is not tagged smoke and must be run explicitly; no claim that default smoke covers it.

CI currently has no database in the browser job. A complete additional job is prepared in docs/reviews/TICKET-131/ci-proposal.md; CI modification needs explicit approval under AGENTS.md before applying. Ticket criterion remains unticked until both projects pass in CI. Next: receive approval, apply the reviewed job, run CI, then full t:pr transition. No product changes or physical-device release certification.
