# Ticket

Ticket: TICKET-067

# Summary

Offline reconciliation already preserves conflicting admission reports without double-counting a party, and the admin scan log already supports append-only resolution notes. Gate operators could not see those conflicts on other scanners. The scanner now shows recent conflicts and their latest resolution, refreshed through its existing realtime subscription and fallback polling.

# Changes

- Add an authenticated, session-bound, no-store projection of the latest 25 conflicts, with household, operator/device, device/server times and reported/canonical counts.
- Recheck access after the query and strictly validate the projection; never load credentials, pass tokens, dietary or contact fields.
- Reuse the existing scanner notification subscription, without applying untrusted broadcast counts as canonical data.
- Keep this list in online memory only; clear it when offline or access is lost and fence obsolete responses.
- Retain the existing admin Scan log resolution workflow and immutable original evidence.
- Add an actual two-device offline-entry/sync browser journey to the existing scanner runner.

# Acceptance criteria and evidence

- Existing reconciliation unit coverage passes for two devices reporting four of four: canonical admitted count remains four and the second report is flagged.
- New response and client tests cover unauthorized access, access replacement during query, strict bounded data, stale-session fencing, offline clearing and resolution display.
- Remaining: actual two-device realtime timing, all-theme accessibility/screenshots, independent review and hosted CI. This PR remains a draft until these pass.

# Verification

- New response tests: 3 passed.
- New client/view tests: 3 passed.
- Existing snapshot/scanner-update/reconciliation regressions: 45 passed.
- Initial quick run: types and 18 related tests passed; one effect-cleanup lint warning was corrected without disabling the rule. Focused ESLint then passed.
- Production browser/latency evidence is not yet collected.

# Risks and rollout

No migration or new dependency. Existing server admission and append-only audit rules remain authoritative. The scanner list is bounded to recent conflicts; full history and resolution controls stay in Admin → Scan log. Realtime propagation requires connectivity; offline devices show an explicit reconnect message. No physical-device verification is claimed.

# Screenshots

Pending staff review at 375px; all-theme axe checks are part of the new browser journey.

# UI checklist

Staff scope applies. Shared Card, existing tokens and 18px body text are used; no new motion, imagery, QR generation or theme tokens. Remaining browser/contrast evidence is listed above.

# Harness changes, if any

Existing scanner journey runner includes the new two-device conflict case. Local `--conflicts-only` selects this case for focused verification; default hosted execution retains all existing cases.
