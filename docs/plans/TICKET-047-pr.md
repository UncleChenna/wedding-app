# TICKET-047: reconcile the merged Open Graph preview

## Problem and result

PR #60 delivered the public invitation preview and merged on 1 November, but the shared ticket remained blocked with no PR link. This documentation-only follow-up reconciles software preview completion with the owner-approved separation of release QA. Product behavior is unchanged.

## Changes

- Record the original merged commit and tested head in the ticket.
- Replace the preview completion criterion with an explicit disposition of the unrun device check; preserve its original wording and mandatory release status.
- Retain TICKET-201’s existing physical Open Graph checks and exact-zero CLS criterion. No release dependency or test is removed.

## Verification

Historical PR #60: merge `6ebd4b474928a5289d8e294b95d64c019ba98319`, tested head `b3df9446973c6baf30c5ae29b92f4e5eb484e55c`, successful required CI run `41304954441`. Current base: `eb14549758ac20fdb286325c7aa57ce42605b564`. Current documentation validation passes (223 tickets), local snapshots render, `git diff --check` passes, and `pnpm verify:quick` passes lint and types with no related unit tests for this documentation-only change. Required full CI must pass before this follow-up merges.

## Limits and review

Physical iOS/Android WhatsApp preview checks remain unrun. Historical homepage CLS `0.00007339025002649255` is nonzero, not a pass. TICKET-201 remains a release blocker. Review the ticket’s original phone requirement against TICKET-201’s public Open Graph scope and unchecked CLS criterion. No source, CI, schema, dependency, database or service changes. Rollback is a documentation revert, preserving historical evidence.

## Original implementation evidence

The following is historical evidence from PR #60, not a new verification run.

# Ticket

Ticket: TICKET-047

# Summary

Invitation links now advertise a themed1200x630 couple-photo preview. Every guest receives the same public title, description and image URL; private names and invitation tokens are excluded.

# Changes

- Added a public PNG renderer at /invitation-preview using stored light-theme colours and theme-selected local fonts.
- Added the approved Lauren Mitchell Unsplash stock placeholder and original font licences; image requests need no external fetch.
- Replaced the old file-based placeholder, which otherwise overrides explicit image metadata.
- Added guest-layout defaults; removed incomplete homepage/invitation-guide overrides while preserving page titles and descriptions.
- Kept personal invitation noindex rules, added matching Twitter metadata and explicit public metadata origin.
- Added contract, PNG dimension, inherited metadata and two-invitation privacy tests.

# Acceptance criteria and evidence

- Open Graph title/description/image1200x630: targeted browser tests pass across guest pages and personal invitations.
- No private name/token/ID in metadata: two synthetic invitations tested with JavaScript disabled and WhatsApp user agent; all tags compared, differing order normalized.
- WhatsApp on a physical phone: NOT VERIFIED. No device screenshot or release approval claimed.

# Verification

Two unit contracts pass; production build passes; targeted Playwright3 pass. Twelve endpoint screenshots and four native PNGs inspected. Output tracing includes the JPEG and all four TTF files.
Public-homepage Lighthouse Performance99/100/100 and Accessibility100. Measured CLS0.00007339025002649255 does not meet zero-CLS. Full pnpm verify passed: 491 unit tests / 26 skips, production build, 529 browser tests / 135 skips in 5.8 minutes. Log: artifacts/TICKET-047/full-verification.log.

# Risks and rollout

NEXT_PUBLIC_SITE_URL must be the real public HTTPS origin for WhatsApp to fetch images; loopback URLs cannot provide phone preview evidence.
Approved names/date are fixed public event copy, matching the existing invitation. The photo is a stock placeholder, not the named couple.
Images cache for60seconds; active-theme reads retain their existing cache policy. WhatsApp may retain its own preview cache.
No migration, new package or external service. Rollback by reverting this ticket. Keep the original licences and photo credit in public/share/ATTRIBUTION.md.

# Screenshots and UI checklist

See [complete review](../reviews/TICKET-047/README.md) and its four native PNGs plus twelve width captures.
Keyboard/motion/QR/staff are N/A because this change adds no interactive page content.
Physical device QA and homepage zero-CLS remain unresolved; the review is not an approval.

# Harness changes

No harness source changed. Managed setup omitted its referenced admin-code.html template; copied only the unchanged repository template into the ignored local stack folder, then setup/migrations passed. A dedicated harness regression is recommended.
