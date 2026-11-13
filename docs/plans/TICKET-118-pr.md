# Ticket

TICKET-118

# Summary

Staff labels and admin controls were smaller than the operational design minimum, and the real scanner’s table identifier was 30px. This draft raises those sizes within staff/admin scope and adds a real authenticated accessibility audit.

# Changes

- Keep staff/admin text and controls at least 18px without changing guest component defaults.
- Raise scanner/admission identifiers to 36px.
- Add mobile settings focus clearance above the fixed navigation, preserving desktop behaviour.
- Audit actual PIN/email-TOTP sessions, signed camera verdicts and keyboard-opened order dialogs across all four themes.
- Preserve baseline findings and retain physical device checks in release-blocking TICKET-201.

# Acceptance criteria and evidence

Still in progress. Corrected board/dialog and nine admin route typography/axe checks pass. Final settings focus and full camera retests remain; the expanded camera run uncovered a separate duplicate-read race, which is not hidden or accepted as passing.

# Verification

Production builds pass. Two actual browser cases passed after initial typography fixes. The subsequent three-case run failed on a duplicate zero-admission observation, a pending PIN request under load, and a genuine settings-focus occlusion. The focused settings repair is being verified. No assertion, timeout or required gate has been weakened.

# Risks and rollout

No migration, dependency, authorization or guest typography change. Physical arm’s-length, screen-reader and actual phone keyboard checks remain unverified and release-blocking. Synthetic fixtures remain only in the isolated local database. Draft status is intentional until remaining failures are resolved.
