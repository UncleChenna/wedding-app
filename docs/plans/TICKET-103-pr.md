# Ticket

Ticket: TICKET-103

# Summary

The app now serves /manifest.webmanifest with stored couple names, a short initials label, stable public launch URL, standalone display and active light-theme colours. Branding changes appear without rebuilding.

# Changes

- Added a request-time Next manifest route and pure typed builder.
- Kept id,scope,start_url at /, independent of visitor credentials or invitation links.
- Added a validated public-name reader with a tested2second timeout, approved-name fallback and sanitized logging. Private authorization is unchanged.
- Reused the existing active-theme cache and documented browser/OS refresh limits.
- Considered a separate scanner start URL in docs/pwa.md: it needs its own explicit install identity and authentication design.
- Added unit/browser tests and captured Chromium manifest diagnostics. No package, migration, icon or worker-policy change.

# Acceptance criteria and evidence

- Complete name/launch/scope/display/colour fields: verified by unit tests, served JSON schema and Chromium parsing.
- Active theme changes theme_color: unit test and isolated live ivory-to-blush update, without a rebuild; stored names also update.
- Downstream coverage documented: TICKET-113 owns manifest/HTTPS/worker checks and TICKET-114 owns real-device installs. Both remain mandatory and are not certified by this PR. The user approved this coverage clarification; it removes circular completion wording without removing any check.

# Verification

Seven unit tests pass, quick verification passes, production build passes.
Three production browser tests pass, including live settings change; two additional browser-inspection tests pass.
Chromium reports no parsing or installability diagnostic errors. No actual phone install claimed.
Full pnpm verify passed: 496 unit tests / 26 skips, production build, 529 browser tests / 135 skips in 4.5 minutes. Log: artifacts/TICKET-103/full-verification.log.

# Risks and rollout

Manifest colours use the stored light theme; page viewport colours remain device-aware. Direct SQL theme changes follow existing30second revalidation; authorized activation expires the tag. OS/browser refresh of installed branding is independent.
Icons remain104 and real installs114. This alone does not prove a complete installed/offline experience.
No migration/dependency. Deploy normally; rollback by reverting the ticket. Stable app identity avoids creating a new installation on palette changes.

# Screenshots and UI checklist

No rendered app UI changed; screenshot, responsive-control, motion, keyboard, image/CLS, page Lighthouse, QR and staff checks are N/A for JSON metadata.
Scoped checklist and browser evidence:
https://github.com/UncleChenna/wedding-app/blob/TICKET-103/docs/reviews/TICKET-103/README.md
https://github.com/UncleChenna/wedding-app/blob/TICKET-103/docs/reviews/TICKET-103/browser-manifest.json

# Harness changes

No harness source edited. Setup needed the unchanged repository email template copied into its ignored stack folder. The handoff records proposed template-copy and patch-parser regressions.
