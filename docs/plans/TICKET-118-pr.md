# Ticket

TICKET-118

# Summary

Audit staff and admin screens for readable text, accessible states and keyboard operation. This draft records real baseline evidence before bounded remediation.

# Changes

- Add an owned-stack audit runner with real staff PIN and administrator email/TOTP sessions.
- Measure four-theme axe, overflow and visible text sizes; preserve375px screenshots and machine-readable evidence.
- Record actual14px staff label findings without misrepresenting them as an axe or WCAG minimum-size failure.

# Acceptance criteria and evidence

In progress. Baseline gate/PIN checks pass; kitchen/bar label sizing fails the project threshold. Admin and scanner-result coverage, remediation and final review remain.

# Verification

Initial production build passes. Baseline tests fail on real staff label sizes; a synthetic table-number collision prevented the first admin run and was fixed using unique fixture numbers. No unrun check is counted as passing.

# Risks and rollout

No product code changed yet. All fixtures belong to this isolated local database. Physical arm's-length, screen-reader and phone checks remain release requirements; automated tests do not certify them.
