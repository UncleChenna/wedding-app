## Summary

Add shared CSS motion primitives that preserve immediate access to content and honor reduced motion. Demonstrate fades, gentle rises and signature timing in both themes on /dev/theme.

## Changes

Export server-compatible FadeIn/Rise wrappers; add shared 180ms control, 240ms entrance and 600ms signature tokens. Reduced motion disables entrances and the demo's control transition. Add a minimal client replay demo, behavioral tests, theming documentation, six full-page screenshots, six focused previews and scoped UI review. No envelope implementation or palette change.

## Acceptance criteria and evidence

Browser tests inspect actual keyframes (only opacity/transform), agreed durations and immediate keyboard replay. Reduced-motion mode has no animations/transforms and opacity 1. Signature timing is ready for TICKET-039's envelope implementation. Both themes demonstrate all primitives.

## Verification

Initial unit suite failed on missing primitives. Browser regression caught unapplied CSS-module classes; implementation now follows the existing global styling path. Final quick/full gates passed: 107 unit tests, production build, 21 smoke passes, 7 existing skips. Six screenshot cases passed. Measured zero overflow and CLS at 375/768/1280; actual hover contrast 4.809:1 ivory and 7.809:1 dark, with visible keyboard focus.

## Risks and rollout

Use signature timing sparingly and avoid wrapping fixed/sticky overlays in transformed entrances. Guest-page adoption still needs device review. Existing unrelated small-button/spinner issues remain TICKET-017/021. No dependencies or data migration. Revert this ticket commit to roll back. Earlier unmerged harness/workflow history is included; focused changes follow 5506f63. Human review/merge only.

## Screenshots and UI checklist

[Complete scoped checklist and evidence](https://github.com/UncleChenna/wedding-app/blob/TICKET-016/docs/reviews/TICKET-016/README.md). Screenshots are committed under docs/reviews/TICKET-016/screenshots for both themes at 375/768/1280. Guest Lighthouse, WhatsApp, real-device and QR checks are not claimed: this change adds a developer-only demonstration and does not alter those flows.
