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
- PASS: actual hosted two-device offline sync creates exactly two reports of four, distinct device ids, admitted counts[4,0], exactly one flagged conflict and canonical count4. Both scanners show the conflict within851ms (mobile project) and828ms (desktop project), with8 realtime notifications each.
- PASS: append-only resolution note appears on the scanner while the canonical count remains4. All four theme axe scans and horizontal-overflow assertions pass in both projects. Independent implementation and focused CI-repair reviews found no blockers.

# Verification

- New response tests: 3 passed.
- New client/view tests: 3 passed.
- Existing snapshot/scanner-update/reconciliation regressions: 45 passed.
- Initial quick run: types and 18 related tests passed; one effect-cleanup lint warning was corrected without disabling the rule. Focused ESLint then passed.
- Hosted run43318217477 at exact head38de17ebb98148bf23d069c03e5abdfec5b9d23e passes all ten CI jobs, including general verification, migrations/seed, guest, camera and authenticated admin/scanner journeys. The scanner artifact supplies the committed screenshots/timing.
- Initial hosted run43283580363 exposed ambiguous test selectors matching older synthetic conflict fixtures. The repair scopes assertions to the unique household; no timing/count assertion or immutable fixture was removed.
- Local production build passed; local Supabase was unhealthy under resource pressure, so no local realtime measurement is claimed. Only this ticket’s stack was stopped, with backup preserved. Hosted isolated service verification supplies the actual browser evidence.

# Risks and rollout

No migration or new dependency. Existing server admission and append-only audit rules remain authoritative. The scanner list is bounded to recent conflicts; full history and resolution controls stay in Admin → Scan log. Realtime propagation requires connectivity; offline devices show an explicit reconnect message. No physical-device verification is claimed.

# Screenshots

Eight inspected full-page screenshots: `docs/reviews/TICKET-067/{mobile,desktop}/{ivory-gold,midnight-champagne,emerald-night,blush-sage}-375.png`. Each project also has `timing.json`. Source: run43318217477 artifact `scanner-synchronization-evidence`, TICKET-067 subfolder only. The long list includes earlier synthetic fixtures deliberately preserved; the unique household assertions identify this run’s entry.

# UI checklist

Staff scope applies under TICKET-217.

- PASS — Screenshots: all eight375px images inspected, including conflict details and resolution state.
- PASS — Tokens: shared Card and existing semantic typography/colour tokens; no literal colours, new fonts or token changes.
- PASS — Restraint/typography: one conflict per card,18px body, explicit recorded/received times and reported/canonical counts.
- PASS — Mobile/contrast: no horizontal overflow and zero axe violations in every theme, both browser projects. This feature adds read-only cards, no new tap targets or controls.
- N/A — Motion: no new animation or transitions.
- PASS — Keyboard: read-only semantic headings/list/time elements; existing scanner controls and navigation unchanged.
- N/A — Load/images/performance: no image/font changes; staff scope does not require fresh guest Lighthouse or exact-zero CLS certification.
- PASS — Copy/shared components/staff feedback: plain operational text and explicit count conflict; existing shared cards and existing refresh/session feedback reused.
- N/A — Sharing/devices/QR: no QR output or phone sharing changes. Physical scanner/device checks remain mandatory release QA, not certified by emulation.
- PASS — Verification: all required hosted jobs pass as above; final PR head must pass required CI before merge.

# Harness changes, if any

Existing scanner journey runner includes the new two-device conflict case. Local `--conflicts-only` selects this case for focused verification; default hosted execution retains all existing cases.
