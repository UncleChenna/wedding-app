# Ticket

Ticket: TICKET-045

# Summary

Guests can now save a themed PNG of their accepted invitation's entry pass. The personal invitation offers Save image, file sharing where supported, and an Open image link with hold-to-save guidance that also works without JavaScript.

# Changes

- Add a private PNG endpoint that independently resolves the invitation capability and rechecks accepted RSVP/current pass eligibility.
- Render a 1080px-wide image containing the guest name, party size, read-only signed QR and generic entry instructions. No table, contact, dietary data or editing credential enters the image renderer.
- Use local font outlines before PNG rasterization, avoiding Next ImageResponse's remote missing-glyph lookup with private guest text.
- Wrap long names, preserve integral QR modules/four-module quiet zones and choose the stored light/dark theme according to the guest's appearance preference.
- Reuse the existing pass and Button components. Reserve status-message space, keep keyboard focus visible, respect sharing cancellation and retain a plain image fallback.
- Retain the original physical iOS/Android download requirement unchecked in release-blocking TICKET-201 under the owner's approved preview/device-QA separation.

# Acceptance criteria and evidence

- PNG width and decoded QR: actual raster tests in every theme plus production download/signature/invitation verification. Long names remain on the exported image.
- Authorization: unknown/revoked/declined/sent capabilities return private 404 responses; issuance/rendering failures return a friendly 503 without personal data.
- Automated download/share/fallback: production browser download, cancellation, no-native-share behavior, keyboard activation and no-JavaScript popup all pass.
- Original manual requirement, “Download works on iOS Safari and Android Chrome (manual, recorded),” is not claimed passed. It remains mandatory in TICKET-201, including WhatsApp, native Photos/file sharing and physical QR scans.

# Verification

Base develop: be0d656343ad3d31af0f904c3a8763c6f94dc598.
Seven focused tests pass. Full local gate passes 779 unit tests (41 skipped), production build and 769 browser checks (165 skipped), with format/lint/types/ticket validation green. After the final fallback-copy correction, production build and the expanded dedicated browser test pass again in 7.5s; the final mandatory t:pr full gate also passed.

Three serial Lighthouse mobile runs on the affected personal invitation: performance 99/100/100, accessibility 100 each, CLS zero each. These precede a post-download-only wording correction; initial-load layout is unchanged. Local reports: artifacts/TICKET-045/lighthouse-personal-{1,2,3}.json.
All twelve theme/viewport screenshots and all four generated theme PNGs inspected. Detailed checklist: docs/reviews/TICKET-045/REVIEW.md.

# Risks and rollout

No dependency, lockfile, schema, migration, RLS or paid-service changes. The font adapter uses Next's pinned bundled parser; actual-font tests and all four traced TTFs must remain verified when Next changes. Names unsupported by those local fonts receive screenshot advice instead of corrupted names or remote font requests. Physical device and non-Latin-name QA remain mandatory.

Downloaded images cannot be remotely erased; gate validation remains authoritative. Native file sharing and Photos behavior vary by browser and are not certified by desktop emulation. Deploy through the normal application process; revert this ticket commit to remove the endpoint/control. No database rollback.

This PR overlaps the personal-pass UI with PR78 and the pending PDF PR77. Integrate sequentially and retain all actions during conflict resolution; rerun verification on the integrated develop commit. Do not auto-merge.

# Screenshots

docs/reviews/TICKET-045/<theme>/{375,768,1280}.png: live pass controls and visible keyboard focus.
docs/reviews/TICKET-045/<theme>-image.png: renderer output in each theme.
light.png, dark.png, download.png and long-name.png: actual private endpoint outputs.

Review in an isolated managed checkout: pnpm build, then pnpm exec tsx scripts/review-pass-image.ts. The runner uses ephemeral signing keys and deletes only its synthetic invitation fixtures.

# UI checklist

PASS: screenshots, tokens, typography/restraint, browser mobile overflow/targets, reduced motion, keyboard, contrast, reserved space/CLS, Lighthouse, copy and component reuse.
NOT VERIFIED: physical sharing/device/QR scans; release-blocking TICKET-201 retains them under the explicit preview exception. Staff feedback is N/A.
Review disposition: preview review approved with these disclosed release gates; no production-readiness certification.

# Harness changes, if any

No hooks, skills, CI rules or tests weakened. Added an isolated review runner and actual-font raster coverage to detect Next renderer changes or accidental remote guest-name requests.
