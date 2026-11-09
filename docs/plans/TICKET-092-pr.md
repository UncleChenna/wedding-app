# Ticket

TICKET-092 — Export the guest list to CSV.

# Summary

Admins can download the currently filtered guest list from Guests. Each matching
household includes all its members, with saved RSVP, meal and dietary information.
The download remains private and prevents spreadsheet formulas from executing.

# Changes

- Reuse the guest list's exact search/status/sent/side/table filter function.
  Preserve all/unassigned/literal values and reject malformed or repeated filters.
- Read a consistent database snapshot with an explicit projection. Resolve meal
  IDs against every menu item, including sold-out choices; retain legacy text.
- Export one row per guest, including a blank-member row for empty households.
  Household attendance counts repeat per member and must not be summed as people.
- Authorize the route independently before reading; return private/no-store
  responses, a fixed filename and generic errors. Exclude tokens, contacts and
  internal notes. Quotes, Unicode, multiline notes and formula prefixes are safe.
- Add a keyboard-operable download link using the current client filter state.
  Keep CSV rendering and validation out of that client import.

# Acceptance criteria and evidence

- Formula prefixes (`=`, `+`, `-`, `@`, including leading whitespace/control
  characters) are escaped; quoting and multiline cases are covered by unit tests.
- The real authenticated browser journey combines all five filters and confirms
  exactly the visible household is exported, including its nonmatching member.
  Empty results, empty households, declined replies, unavailable meals and legacy
  meal text are checked against the actual database/HTTP endpoint.

# Verification

Integrated develop `b91a0f0f14103a159619e4b60bd86339c5b12b63` without conflicts.
The export implementation is byte-unchanged from the authenticated browser run;
all 16 focused export/list tests pass again after integration.

- Production build passed.
- Initial unit/route suite: 12 passed; a subsequent long-filter regression preserves
  parity with the unbounded list input. Final quick gate passes lint, strict types
  and 16 related tests across three files.
- Final authenticated browser run: 2/2 passed in 8.3 seconds, at 375px and 1280px.
  Checks real OTP/TOTP authorization, filtered HTTP response, actual downloaded file
  bytes, keyboard activation, eight all-theme axe scans, overflow and 44px targets.
- Unauthenticated requests redirect to sign-in; the handler independently rejects
  signed-out/denied/enrolment/challenge access before querying. Invalid filters
  return 400; query errors return 503 without private details or an empty success.
- Initial CLS measured zero in both browser projects. Independent source review
  and all eight screenshot inspections found no blocking issue. The review's
  filter-length discrepancy was fixed with a round-trip regression.
- Full `pnpm verify` remains a mandatory final-head CI gate; no local full-suite
  run is claimed.

# Risks and rollout

No schema/dependency changes or production data operations. The CSV contains
guest names and dietary notes for authorized planning, so keep downloaded files
private. Counts describe households and repeat per member. Missing menu IDs remain
visible as their stored legacy value rather than losing selection information.
Revert this PR to remove the route and download link. TICKET-089 is merged.

# Screenshots

`docs/reviews/TICKET-092/mobile/` and `desktop/`: all four themes. Each capture was
visually inspected for readable controls, wrapping and navigation clearance.

# UI checklist

PASS: admin screenshots, theme tokens, restrained existing typography, 375px
wrapping/targets, keyboard activation/focus, reduced motion, all-theme axe/contrast,
zero initial CLS and existing navigation. No image/font/animation changes.
Guest Lighthouse, WhatsApp preview, QR output and scanner feedback are N/A for this
private download link. Physical-device testing is not newly certified; existing
release gates remain. Final CI is required before merge.

# Harness changes, if any

An opt-in runner uses fresh synthetic admin identities, the guarded isolated
database and one browser worker. Cleanup deletes only its exact fixture IDs.
No database reset, collaborator stack change or new dependency is required.
