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
