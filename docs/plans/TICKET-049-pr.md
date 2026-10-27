# Ticket

Ticket: TICKET-049

# Summary

Guest lists include UK local phone numbers and formatting characters that cannot be used directly in a WhatsApp link. Add a pure normalizer that returns a canonical international number or an actionable typed error.

# Changes

- Normalize UK national, bare 44, + and 00 international formats.
- Accept spaces, nonbreaking spaces, dots, hyphens and balanced digit parentheses; support explicit UK (0).
- Reject ambiguous unprefixed overseas formats, extensions, malformed punctuation, invalid runtime types and implausible lengths.
- Preserve significant international zeroes; expose a discriminated result so callers handle invalid input without exceptions.
- Add 51 table-driven cases; downstream share-link UI stays in TICKET-050.

# Acceptance criteria and evidence

All three required examples normalize to +447700900123. Tests cover typed errors for invalid values and repeated normalization.

# Verification

51 phone cases pass. Quick gate passes lint, types and related tests. Full `pnpm verify` passed: 203 tickets valid, formatting/lint/types, 342 unit passes (10 opt-in database skips), production build and 172 browser passes (28 conditional skips). No retries. Log: `.harness/t049-verify.log`. DB-backed invitation checks were not enabled for this pure utility change.
Verification base: dc31f20756eddff4b9744c3fbbd7c99a4a798fa9.

# Risks and rollout

No dependencies, migrations, services or UI changes. Normalization checks structure, not allocation, ownership, reachability or WhatsApp membership. International contact policy is 7–15 digits; UK national parts support 10 digits and nine-digit geographic numbers beginning 1. Other local formats need an explicit country code. Rollback is reverting this isolated helper before dependent sharing work uses it.

# Screenshots

N/A: no rendered UI changes.

# UI checklist

N/A: pure data utility only; no components, styles, copy displayed in the app or browser behavior changes.

# Harness changes, if any

None.
