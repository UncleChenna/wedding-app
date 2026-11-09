# Ticket

TICKET-091 — Import guests from CSV with a validation preview.

# Summary

Draft upload-and-confirm UI for TICKET-182's transactional guest importer. Work
started ahead while182 is in progress; no production import screen or completed
backend integration is claimed yet.

# Changes

Added an injected-action upload/preview/confirm component and a display-only view model. It bounds files to256KB, decodes UTF-8 strictly, invalidates approval on file changes and ignores stale responses. It renders row errors and grouped invitations, submits only preview ID/digest, and reports replay without claiming duplicates were added. CSV
parsing, duplicate policy and atomic writes remain owned by182 (PR124).

# Acceptance criteria and evidence

Not yet complete. Planned evidence: malformed CSV, corrected preview, explicit
confirmation,300-rowimport,repeatedimportno-duplicates,andexistingRSVPpreservation.

# Verification

Nine component tests pass after an initial missing-module failure and a reproduced expiry-during-commit failure. Quick lint/types and related tests pass. No production route, actual backend integration, database or browser evidence is claimed yet.

# Risks and rollout

Draft only; cannot finish until182merged and actual database/browser tests pass.
No production data or schema operations proposed by091.

# Screenshots

Pending UI implementation and all-theme browser evidence.

# UI checklist

Pending, following the admin scope including18pxcontrols,44pxtargets andallthemeaxe.

# Harness changes

None.
