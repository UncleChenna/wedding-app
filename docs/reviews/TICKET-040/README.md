# TICKET-040 RSVP review

2026-10-31, base develop c22d9d94105817f10c63b7dae239fd2d4f6686e6. Synthetic household/guest data only. Review covers the saved personal RSVP form, not tag-alongs, editing cutoff or QR passes.

## Evidence

- Six real mobile/desktop tests pass after the final POST-routing cleanup: yes/no persistence with and without JavaScript, token-free Origin/Referer behavior, tampered token rejection and revocation between rendering and POST. No framework error is accepted as success.
- Five real database tests pass: atomic status/RSVP persistence, repeated replies update one record, invalid/draft/revoked tokens rejected and venue-timezone TBD keeps replies closed.
- Twelve visual review cases pass: four themes ×375/768/1280, each with initial/yes/no/error/closed states, keyboard submission, focus feedback, reduced motion, axe and44px targets. All60 originals are under screenshots/. Four review sheets were inspected: rows375/768/1280, columns initial/yes/no/error/closed. Sheets crop only desktop outer margins and account for screenshot device scale; originals are unchanged.
- Three Lighthouse13.6.0 production runs on a synthetic personal invitation: Performance100/100/100, Accessibility100/100/100, CLS0 each. See performance.json; private fixture URLs are omitted from committed metrics. The fixture was removed afterward.

## Checklist

| Item                 | Result and evidence                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS:60 saved-state captures, all inspected.                                                                                                                              |
| Tokens               | PASS: existing classes/tokens, no new colour/font/radius/shadow literals.                                                                                                 |
| Restraint/typography | PASS: one attendance question, primary yes/secondary no, serif heading and readable body, restrained separator.                                                           |
| Mobile               | PASS in emulation: all widths fit, targets44px+, safe-area padding; actual device checks remain unverified.                                                               |
| Motion               | PASS: reduced-motion matrix and existing shared motion rules; no new animation.                                                                                           |
| Keyboard             | PASS: Tab reaches yes, Enter submits, result receives focus, labelled status and visible outline.                                                                         |
| Contrast             | PASS: axe at all60 states plus validated tokens; wording conveys errors without colour alone.                                                                             |
| Load/images          | PASS: CLS0 in three production measurements. No new images; existing next/font with swap.                                                                                 |
| Performance          | PASS:100/100 across three production mobile measurements.                                                                                                                 |
| Copy                 | PASS: approved warm yes/no and confirmation wording; generic actionable errors.                                                                                           |
| Shared components    | PASS: shared Button; this feature-specific form is exercised on its actual invitation route.                                                                              |
| Sharing/devices      | NOT VERIFIED: actual iOS/Android WhatsApp/native-browser submission and history. Generic invitation metadata remains private/noindex; no guest details added to previews. |
| QR                   | N/A: no QR output changed.                                                                                                                                                |
| Staff feedback       | N/A: guest RSVP only.                                                                                                                                                     |
| Verification         | Full gate currently running; quick lint/types, five DB, six live browser and twelve visual cases pass.                                                                    |

Decision: CHANGES REQUESTED for release approval until real-device WhatsApp checks pass. A merge with those checks tracked separately needs explicit approval because the previous exception covered labelled previews and this form saves replies. The product remains closed with the real venue timezone TBD. No launch readiness is claimed.
