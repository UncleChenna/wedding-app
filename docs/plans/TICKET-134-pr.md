# Ticket

[TICKET-134](../../tickets/TICKET-134-cover-admin-guest-import-seating-menu-and-staff.md) — Cover admin guest import, seating, menu and staff end to end.

## Summary

Separate feature tests did not prove the couple could complete setup in one authenticated session. A new combined browser journey now signs in through real local email OTP and TOTP, imports a two-person household, copies its invitation, seats both people, adds and edits a menu item, and provisions a kitchen PIN that works in a separate browser context.

## Changes

- `e2e/admin.spec.ts` exercises actual navigation and form submissions on mobile (375px) and desktop. Independent SQL assertions verify no import writes before confirmation, one household/two named members, sent status and copy event, household/member table assignments, saved menu edits, hashed PIN and registered kitchen device. Reload proves the issued PIN is not shown again.
- The browser uses real clipboard permissions and verifies the copied invitation path. It sends no WhatsApp/email invitation and does not claim delivery.
- `scripts/test-admin-journey.ts` creates fresh synthetic admin addresses and an ephemeral staff session secret, delegates database identity to unchanged `assertDatabaseTarget`, adds Auth/PW identity checks before writes, migrates its own stack, and runs both browser projects serially. Run `pnpm exec tsx scripts/test-admin-journey.ts --build` in a managed worktree with its database running. Repeated runs get fresh fixtures; event date is thirty days ahead and the original settings are restored.
- `scripts/admin-journey-ci.ts` refuses non-hosted execution, another workspace, linked checkouts or existing runtime configuration. A fresh GitHub-hosted checkout reuses `isolatedConfig` and the actual Auth template copier; generated local environment values explicitly override inherited CI defaults. Existing local Auth helper guards remain unchanged.
- A separate `admin journey (mobile + desktop)` CI job starts disposable Supabase Auth/mail/PostgreSQL, migrates, builds and tests. Existing gates remain intact. An always-run step stops only that job's stack.
- OTP/TOTP/PIN browser traces, videos and screenshots are disabled. CI uploads only small sanitized outcome JSON, never browser reports, session captures or generated environment files.

## Acceptance criteria and evidence

- [x] The admin journey passes in CI — [run42619092760, admin job129166376145](https://github.com/UncleChenna/wedding-app/actions/runs/42619092760/job/129166376145) passed both projects in15.6s at `ed331b82bd6a62a778a802b3afcd7569b7ceb59f`. Hosted setup, real Auth/mail, migrations, build, artifact upload and stack cleanup all passed.

## Verification

- Existing full verification on that run failed only the inherited scanner CI-parity expectation: 1390 unit tests passed,153 skipped,1 failed. The separately tracked parity repair must be integrated and all final-head gates rerun; this is not merge approval.
- Local production build passed on integrated product base `b1a15b64` (merge checkpoint `69f04a51`).
- Both real browser projects passed: mobile 10.0s, desktop 3.8s, total 17.1s; `/tmp/TICKET-134-browser-final.log`. Sanitized outputs: `artifacts/TICKET-134/mobile.json` and `desktop.json` (ignored locally, uploaded by CI).
- Thirteen bootstrap/CI safety tests passed, including another local DB/Auth target, invalid hosted guards, existing-file preservation, template symlink rejection and environment override.
- Quick verification passed lint, types and thirteen related unit tests; final publication gate is rerun after evidence edits.
- Initial browser runs caught a stale newly integrated reminder migration and two selector issues. The runner now migrates locally too, and selectors use actual navigation and the visible assignment dialog. No functional assertions or existing gates were weakened.
- Owned stack `wedding-5f0289a6a7a4` stopped successfully with `backup:true`; `/tmp/TICKET-134-db-stop.log`.

## Review steps

1. Review the bootstrap's fresh-hosted guards and both target checks before fixture writes.
2. Run the managed-worktree command above; confirm both projects pass, with no mocked authentication or external messages.
3. Confirm the dedicated CI job and all existing checks pass on the final PR head before completing the ticket.

## Risks and rollout

No product UI, schema, migration, dependency, production data or account changes. Generated identities and local credentials are ignored runtime files. Only uniquely named synthetic fixtures are removed; settings are restored, and no audit guards are disabled. Auth test users remain solely in the disposable local stack. Revert this ticket's new test/runner/job to roll back.

Browser emulation is not physical-device certification. Real-phone, camera, WhatsApp, venue and page-speed release gates remain separate. This journey does not certify external message delivery or production deployment. No new UI screenshots are required because no product UI changed, and capturing the PIN/authentication screens would retain credentials.
