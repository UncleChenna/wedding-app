# TICKET-195 — 2026-10-26

Owner divine; agent codex; branch TICKET-195; base 140acb7.

Changed applyTheme to await the existing finite-animation helper. Added a real offline-button regression for both switch directions on mobile and desktop. Four failures before fix, four passes afterwards; six screenshot captures passed and all inspected. Evidence: [review](../reviews/TICKET-195/README.md).

Quick and full verification passed: 270 unit tests, 167 browser passes, 17 conditional skips. Integration with the event-policy PR preserves both progress entries. Optional isolated Supabase startup was interrupted because this test-only ticket needs no database. No database data was deleted. Next: run the integrated PR gate, publish the PR and wait for required checks.
