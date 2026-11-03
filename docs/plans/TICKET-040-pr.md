# Ticket

TICKET-040 — Build the RSVP form for attending yes or no.

# Summary

Personal invitations now save attendance and show the approved warm confirmation on submission and reload. Native submission works without JavaScript. The draft remains subject to final CI and physical-device review.

# Changes

- Validate attendance and invitation capability with Zod; lock and recheck the published invitation inside a database transaction.
- Upsert one RSVP and update invitation status atomically.
- Reuse themed buttons, pending feedback and accessible confirmation focus.
- Keep replies closed when venue timezone is undecided.
- Render personal HTML without a script-dependent loading placeholder.
- Strip invitation paths/tokens from referrers with strict-origin while retaining unchanged Next.js CSRF checks.
- Let POST reach its validating action, avoiding framework errors after revocation.
- Make outstanding physical saved-RSVP QA in TICKET-201 block both release milestones.

# Acceptance criteria and evidence

All three functional criteria pass: persisted yes/no with approved copy, rejected invalid/revoked tokens, and no-JavaScript submission. Five real database tests and six mobile/desktop browser tests cover these behaviors, including final POST routing cleanup.

# Verification

- Five isolated database tests pass.
- Six real mobile/desktop browser tests pass.
- Twelve review cases pass: four themes ×375/768/1280, with initial/yes/no/error/closed states, axe, keyboard/focus, reduced motion and44px targets.
- Three Lighthouse13.6.0 production runs: Performance100/100/100; Accessibility100/100/100; CLS0/0/0.
- Full local gate completed formatting, lint, types,455 unit tests (21 opt-in skips) and build. Final browser report records passed with no failed tests; the terminal session was lost during continuation, so no unconfirmed browser total is claimed.
- Independent t:pr gate passed: formatting, lint, types,455 unit tests (21 opt-in skips), production build and481 browser tests (129 intentional skips). Final-head GitHub CI remains pending.

Verified develop base: c22d9d94105817f10c63b7dae239fd2d4f6686e6. No tests, hooks or security checks were weakened.

# Risks and rollout

Venue timezone is TBD, so real guest replies remain closed. Tag-alongs, edit cutoff and history remain linked tickets041/042. Actual iOS/Android WhatsApp/native-browser checks are unverified in release-blocking TICKET-201. This is not launch approval.

No migration, RLS policy or dependency change. Reverting this feature stops submissions but preserves saved database rows. Use only labelled synthetic invitations during review; real tokens must never appear in screenshots or logs.

# Screenshots

Sixty originals and four inspected contact sheets: [review evidence](docs/reviews/TICKET-040/README.md). Rows375/768/1280; columns initial/yes/no/error/closed. Metrics redact the synthetic invitation URL.

# UI checklist

PASS: screenshots, token reuse, restraint/typography, emulated mobile layout/targets, reduced motion, keyboard/focus, axe/contrast, load stability, performance, approved copy and shared Button reuse. QR and staff feedback are not applicable. Physical sharing/devices remain NOT VERIFIED; see the full checklist in the review evidence. Independent full verification passes; final-head GitHub CI and physical-device review remain pending.

# Harness changes, if any

No hook/policy changes. Review tests opt in and validate the isolated database identity and fixture label before mutation. ADR0019 documents native rendering and token-safe requests. Cache recovery used the user's exact-path approval.
