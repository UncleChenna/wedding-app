# Ticket

Ticket: TICKET-053

# Summary

Administrators can now open **Sharing → Remind guests awaiting a reply** to see exactly sent invitations with no RSVP and re-share the approved Warm RSVP nudge. Sharing happens only through an explicit administrator action; nothing sends automatically.

# Changes

- Added protected reminder page and minimal authorized reader. The query excludes every RSVP row, including inconsistent sent/declined records; last shared uses current-version, non-undone events with original sent time as the legacy fallback.
- Reused the existing Share menu, including keyboard/Escape behavior, clipboard fallback, native cancellation and Undo. WhatsApp/email/native share receive approved nudge copy; Copy link remains clearly labelled and copies only the URL.
- Additive0022migration adds `invitation_share_events.purpose`, defaulting old records to `invitation`. Reminder events store the existing minimal metadata only; no recipient contacts, message body or invitation URL.
- The existing invitation lock protects reply/version checks before reminder recording. Retries match purpose/channel/actor/version; Undo preserves later RSVP state and first sent time.

# Acceptance criteria and evidence

- Exact sent/no-RSVP list: query unit test checks actual generated SQL; isolated fixture covers all statuses and sent plus RSVP, current/other token versions and undone events.
- Reminder event: real database and authenticated production browser assert purpose=reminder, channel=copy, one event, timestamp refresh and Undo. Cancelled native share writes nothing. Stale reply/version/draft/revoked cases reject without new events.

# Verification

Base: develop14d04bb2. `pnpm verify:quick`: lint/types pass,162related tests pass/114database tests skipped by normal gate. Explicit isolated runs:8tests pass (3reminder+5existing sharing). Production build passes. `pnpm exec tsx scripts/test-admin-reminders.ts`:1/1passes(9.3s test), actual local Auth/TOTP and database, no external messages. Four themes:axe0 and menu/list overflow0;375/600/768/1280 widths; keyboard Enter/Escape/focus, reduced-motion setting, unauthorized redirect and no-store checked.

Migration0022applied twice; `/tmp/TICKET-053-counts-{first,second}.json` identical. Seed applied twice; `/tmp/TICKET-053-seed-{first,second}.json` identical. All23public tables retain RLS. Initial database test import failure was fixed by splitting the environment-free repository from the authorized page reader; final tests pass without changed assertions/timeouts.

Full verification runs in CI and must pass before merge. No physical phone/external-message delivery certification; retain TICKET-201release gates. Sharing attempts explicitly do not certify delivery.

# Risks and rollout

Apply generated0022before the new server code; no existing event is removed and no RLS policy changes. Rollback app code can leave the harmless defaulted column in place. No production migration was run. Browser can open a share app while a guest concurrently replies; the later server record is rejected after locking, and no reply is overwritten. Expiry/automatic reminders are not added.

# Screenshots and UI checklist

Inspected `docs/reviews/TICKET-053/reminders.png` and `reminder-menu.png`:375px Ivory & Gold. Full-page screenshot captures fixed navigation at its viewport position; list remains scrollable. Native sheet scrolls for long copy.

- PASS screenshots, token-only styles,18pxadmin body/control text, restrained serif headings, readable wrapped nudge.
- PASS mobile/intermediate widths, keyboard dialog Escape/return and Undo focus, all-theme contrast/axe; shared components reused, no new pattern.
- PASS approved Warm copy; immediate sharing feedback, explicit attempt/Undo wording.
- PASS existing reduced-motion behavior; no new animation, images, fonts or layout assets. Exact cold-font CLS remains existing TICKET-201release gate.
- N/A guest Lighthouse, QR changes and staff scan feedback:admin list/share UI only.
- NOT VERIFIED physical OS share/WhatsApp delivery:existing release gate201; simulated browser native cancellation and clipboard only.
- PASS local quick/build/targeted browser/database gates; fullCI pending.
