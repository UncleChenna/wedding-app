# TICKET-198 UI review

## Scope and evidence

Home `/`, invitation guidance `/invite`, reviewer index `/dev`, and `/dev/invitation`. Screenshot matrix: `screenshots/TICKET-198/` (four pages × two themes × 375/768/1280). Reviewed both theme contact sheets and full mobile invitation images; no clipping or unintended wrapping. Browser tests also inject an 80-character unbroken name.

## Checklist

- Screenshots: PASS — all four pages, both themes and three widths captured by Playwright. See attached matrix.
- Tokens: PASS — existing theme color/font utilities only; metadata image uses active theme colors. No new theme schema or component tokens.
- Restraint/typography: PASS — serif headings, readable body copy, one image, no added ornamental treatment. Existing guest-layout pattern retained.
- Mobile: PASS — automated no-overflow and minimum 44×44 link targets; no fixed controls or keyboard inputs.
- Motion: PASS — no added animation; reduced-motion browser coverage included.
- Keyboard: PASS — start focus established on the document, Tab reaches links; native links and global visible outline used. No dialogs.
- Contrast: PASS — axe checks every page/theme/width; labels accompany all navigation states.
- Load/images: PASS for measured routes — image dimensions reserved, next/image static WebP with blur placeholder, responsive sizes, descriptive sample-photo alt. Home, guidance and default invitation preview measured CLS 0. Alternate-theme physical-device behavior remains unverified.
- Performance: FAIL — latest isolated mobile results: home 92, guidance 96, preview 94; all Accessibility 100 and CLS 0. Home also measured 95 after disabling unused font preloads, so it is not consistently meeting 95. Baseline was 93. See TICKET-198-performance.json; do not treat a single passing run as a stable pass.
- Copy: PASS — PRD headline/subline reused. Confirmed names/date; all venue, photograph and dress-code samples labelled. Guidance wording provisional.
- Shared components: PASS — no new reusable UI primitives; semantic links use existing global focus rules. Feature presentation isolated in invitations module.
- Sharing/devices: NOT VERIFIED — generated 1200×630 public preview image and metadata; actual WhatsApp sharing and iOS/Android in-app checks require real devices.
- QR: N/A — no QR output.
- Staff feedback: N/A — no staff UI changes.
- Verification: see final gate results below.

## Findings

No known responsive or accessibility failures remain. Production invitation integration is deliberately not included. Replace sample photography and sample location before production invitation delivery. Real-device sharing and remaining performance evidence prevent final UI approval; keep this work in review rather than declaring the full invitation feature done.

## Gate results

pnpm verify:quick and pnpm verify PASS: 200 ticket definitions, formatting, lint, types, 234 unit tests, production build, 117 browser tests. 15 existing skips. All 24 responsive screenshots recorded and reviewed; no automated accessibility or overflow failures.

## Review decision

CHANGES REQUESTED before final UI approval: bring home and preview consistently to Performance 95, and verify actual WhatsApp previews and iOS/Android navigation. Publish a draft PR for visible progress and review; do not mark the ticket done.

## 26 October follow-up

Disabled alternate-theme font preloads (fonts remain available on demand), set the hero to eager/high-priority loading and disabled speculative prefetch on guest navigation links. The latter trades automatic background downloads for loading the destination on activation; navigation behavior is covered by the browser tests. No font faces, typography scale or theme tokens changed; TICKET-015 remains paused. Full gate repeated: 234 unit tests, 117 browser tests, 15 existing skips. Both-theme layout captures repeat successfully. Review decision remains CHANGES REQUESTED pending the stated evidence or an explicit preview-only exception from the user.

## User-approved preview exception — 26 October 2026

The user explicitly approved: "Merge previews; track remaining QA separately". Remaining performance and actual-device checks are tracked by TICKET-201. This approves merging labelled previews once automated gates pass; it does not approve guest production release or claim pending checks passed. TICKET-015 remains paused. Proceed with TICKET-199 after 198 merges.
