# Ticket

TICKET-209 — Connect guest, staff and admin journeys into one app.
**Draft: preview exception approved; post-merge integration verification remains outstanding.**

# Summary

Pages were isolated from one another. This change connects configured guest entry pages, RSVP next steps, staff stations and authenticated invitation sharing through a typed route registry. Unbuilt features retain explicit placeholders and their owning tickets.

# Changes

- Register all21 pages; encode invitation paths and test the registry against filesystem routes.
- Read event settings for home and metadata; provide human resend guidance. Preserve reply editing and show the appropriate pass/closing/form state. Day-of ordering uses the venue time zone; TBD suppresses automatic day-of links.
- Add staff home, bar placeholder and station return links.
- Provide an authorized admin hub and Sharing list. Draft/revoked invitations cannot be shared. Sharing opens a client or copies a link; it does not send messages or change sent status.
- Crawl actual rendered links from each entry point, including authenticated email/TOTP and real offline fallback; a negative fixture proves orphan detection.
- Return404 for production /dev routes by default. Local browser tests opt in explicitly.
- Integrate develop02c9923 sharing metadata and replace fixed public names/date with saved settings in social tags and image artwork. Preserve the token-free image URL and approved wording. Public layout metadata revalidates after30s and expires after300s; guest data is not cached.
- Mark the Node proxy server-only so its existing local-preview environment read obeys the merged security rule; no exemption. Quick verification, production build and both production-preview guard tests pass.
- Keep public pages/metadata/artwork available during database outages through an explicit public-field projection and approved-default fallback. Private invitation/RSVP readers remain strict. A genuinely database-free build and both unchanged sharing smoke cases pass;17 public/strict-settings unit cases pass.
- Keep journey fixture cleanup independent of a closed browser and attempt database cleanup even when MFA cleanup fails. No behavioral assertions or timeouts changed.
- Document role/route ownership in docs/journeys.md. Stabilize home containers and guidance heading wrapping.

# Acceptance criteria and evidence

Base develop:99be217ae101133995e63af416ef6dc66f1f39fa (integration e799d1e).
Functional criteria were verified before integration. The owner approved preview advancement while retaining exact-zero CLS and physical-device release gates; this is not production UI approval.

# Verification

- Full standard pnpm verify:584 unit cases passed,26 skipped;731 browser smoke cases passed,153 skipped. Skips are not certified.
- Subsequent test-only expansion: all six before/day-of RSVP state cases and quick lint/types/related tests pass.
- Authenticated journey and twelve staff matrix checks pass (13 cases); dedicated local MFA flow passes.
- Three private invitation Lighthouse runs: Performance99/100/100, Accessibility100/100/100, CLS0/0/0. Only synthetic data was used and the temporary invitation was removed.
- Post-merge focused evidence:4 metadata/artwork unit tests, quick lint/types, production build and2 unchanged all-theme sharing browser tests pass. Rebuilt authenticated journey passes1 case (10s); actual all-theme PNGs are byte-identical to reviewed047 images. After the public-outage correction, the restored authenticated journey passes1 case (5.8s). Two earlier runs were interrupted by recorded macOS maintenance sleep; process-scoped AC sleep prevention resolves that interruption. Final full standard verification is pending.
- Latest single-run public scores: home98, guide99, order96, offline99; Accessibility100. Earlier lower scores are retained.

# Screenshots and UI checklist

Complete per-item results and report links: docs/reviews/TICKET-209/REVIEW.md.
Inspected60 RSVP,48 staff,36 admin,84 production public/auth and60 MFA captures, plus all distinct supplemental showcase sections, at375/768/1280 in all four themes. The MFA screenshot helper substitutes public example credentials.

**Unresolved:** the separately executed exact-zero cold-font regression fails12/16 cases after local layout improvements. Centered text and adjacent text fragments move horizontally as fallback glyph widths change. Latest guide Lighthouse CLS is0.0000998462969631127, not zero. This regression is outside the standard @smoke selection and is not covered by its green result. No assertions or thresholds were relaxed.

Physical iOS/Android WhatsApp, keyboard/safe-area and authenticator scanning remain unverified. TICKET-201's release gates remain mandatory. The owner approved “Advance preview; retain exact-zero release gate.” The PR remains draft until remaining integration checks pass.

# Risks and rollout

Real QR passes/signing, staff PIN protection, scanning/orders and remaining admin areas belong to their existing tickets. This is navigation integration, not certification of those features. No migration, RLS, dependency or CI changes. Roll back by reverting this ticket; no data conversion is needed.

# Review steps

Use isolated synthetic settings/invitations. Visit / and /invite; exercise yes/no/edit replies and home return. Navigate /staff to each station and back. Sign in to /admin, open Sharing, verify draft/revoked exclusions and dialog focus return. Confirm ordinary production /dev routes return404. Preserve failed font tests and release gates.
