## Summary

Audit actual guest invitation, saved RSVP and issued-pass pages for keyboard access, automated WCAG2.2 A/AA checks and text resizing. Fix a narrow-layout heading overflow without shrinking text or changing the invitation wording.

## Changes

- Add an opt-in audit runner using isolated synthetic guests and ephemeral signing keys.
- Exercise four themes at320/375/768/1280px, reduced motion, real keyboard submissions and200% text sizing. Preserve baseline and final screenshots/JSON.
- Allow “The celebration” heading to wrap at enlarged text sizes.
- Record physical VoiceOver/TalkBack and device checks explicitly in release-blocking TICKET-201.

## Acceptance criteria and evidence

- Audit report: `docs/audits/TICKET-117-guest-accessibility.md`.
- Before:12/16 cases passed; all four320px enlarged-text cases overflowed.
- After:16/16 pass;80 rendered-state axe scans report no A/AA violations. Saved RSVP and guest details focus their status announcements.
- Outstanding: final native-ordering audit after TICKET-081 merges; physical assistive-technology/device checks and full no-open-serious sign-off. This remains a draft and does not certify full WCAG conformance or release readiness.

## Verification

- Production build passes on base207798dc4f1535aecbf254ef3959def934d9eee2.
- `pnpm exec tsx scripts/review-guest-accessibility.ts`:16/16 pass after fix (30.5s).
- Root text sizing is used for200% text tests; this is not a claim of physical browser zoom.
- Quick verification passes lint and types; no related unit tests were selected after the committed audit. Independent bounded source/coverage review is clean.

## Risks and rollout

One existing heading gains emergency word wrapping. No data or schema changes. Audit-only synthetic fixtures are retired, preserving database history. Revert the wrapping utility to roll back the UI change. Physical screen-reader, WhatsApp, QR, Lighthouse and CLS checks remain mandatory release evidence; no skipped check is represented as passed.
