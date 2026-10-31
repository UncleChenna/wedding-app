# Ticket

TICKET-109 — Prompt installation on Android and Chrome

# Summary

Eligible browsers can offer installation from staff pages and the invitation's actual pass section. The offer waits for visitor interaction, and dismissal suppresses it for 30 days. Installation remains optional.

# Changes

- Root-mounted event capture preserves browser eligibility across client navigation.
- A shared controller consumes each native event once, handles installation elsewhere, and tolerates storage and native prompt failures.
- Shared themed buttons reserve a control row to avoid moving pass content when eligibility arrives. No overlay covers the QR or staff controls.
- The shared pattern also appears on /dev/theme when an eligible event is available.

# Acceptance criteria and evidence

- Eligibility and interaction gating: eight controller unit tests pass.
- Thirty-day dismissal: expiry boundary, native dismissal, persistence and unavailable storage are covered.
- Six production browser cases pass across mobile and desktop, including reload persistence and installation elsewhere.
- Full verification, visual evidence and required device review are still pending. This is an unfinished draft.

# Verification

- Initial regression run failed because the controller did not exist.
- Eight controller tests pass.
- verify:quick passes (lint, typecheck and related unit tests).
- Production build passes.
- Playwright e2e/install-prompt.spec.ts: 6 passed.
- Full pnpm verify is running; see artifacts/TICKET-109/verify.log locally. No full-gate pass is claimed.

# Risks and rollout

The browser API is limited to supporting browsers; iOS guidance remains TICKET-110. Unit/browser stubs prove application behavior, not actual installation eligibility. Icons/installability, offline pass and scanner are separate tickets. Current staff routes remain placeholders; the guest control mounts only when real pass content is supplied. No database migrations or new dependencies. Revert this ticket's changes to remove the prompt.

# Screenshots and UI checklist

Pending screenshot inspection at 375/768/1280 in all four themes, keyboard and reduced-motion review, rendered contrast checks, CLS and performance measurement. Physical Android installation and WhatsApp checks are not verified. Existing theme tokens and shared buttons are reused; no QR output, photograph, status meaning or scan feedback changes.

# Review steps

Use a browser that supplies beforeinstallprompt; on /checkin interact with the page, then choose Install app or Not now. Automated tests stub eligibility and assert the native prompt is invoked only after an explicit click. /dev/theme shows the same component in each registered theme.

# Harness changes

None.
