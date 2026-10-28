# Ticket

Ticket: TICKET-195

# Summary

Theme review could capture a button in the previous theme's colour because applyTheme returned while its CSS transition was running. The helper now waits for finite animations before returning, so immediate colour assertions and screenshots represent the selected theme.

# Changes

Reuse settleAnimations after the existing font wait. Add smoke regressions against the real offline retry button, switching ivory to midnight and back on mobile and desktop. Preserve component transitions, existing cancellation handling and infinite-animation exclusions.

# Acceptance criteria and evidence

- Immediate primary-colour assertion: four regression failures before the fix, four passes afterwards with no retries. The one-second transition override exists only in the regression fixture and makes the race deterministic; the assertion reads once without polling.
- Screenshot check: six captures passed and were inspected, covering both registered themes at 375/768/1280. [Evidence](../reviews/TICKET-195/README.md).

# Verification

- Focused Playwright: 4 passed, 0 retries.
- SCREENSHOT_ROUTES=/offline pnpm screenshots --workers=1: 6 passed.
- pnpm verify:quick: passed.
- Full gate: passed; 270 unit tests, 167 browser passes, 17 existing conditional skips. The integrated t:pr gate repeated these results successfully.

# Risks and rollout

Test infrastructure only; no production routes, styles, packages, migrations or configuration change. Finite animations can add their actual remaining duration to tests; infinite animations remain excluded. Revert this commit to roll back. No deployment or data migration required.

# Screenshots

Six inspected offline-page screenshots are committed in docs/reviews/TICKET-195. The midnight button has champagne fill and dark text, and ivory retains its dark-gold fill and light text. No horizontal overflow observed.

# UI checklist

Product UI is unchanged, so new token/typography/layout/keyboard/Lighthouse/device/QR/staff-feedback checks are not applicable. Screenshot correctness is the scope and is verified above. Existing full smoke coverage checks production behaviour; these screenshots do not claim physical-device or release QA.

# Harness changes

The shared e2e theme helper waits for existing finite animations instead of returning mid-transition. No hook or check is disabled or weakened.
