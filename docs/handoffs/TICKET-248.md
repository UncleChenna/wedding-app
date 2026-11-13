# TICKET-248 handoff

2026-11-13. Owner divine; agent codex. Branch TICKET-248; draft PR https://github.com/UncleChenna/wedding-app/pull/207. Implementation checkpoint fbd6527e is pushed.

## Implemented and verified

The native saved-pass online listener now requires current online connectivity and an active document. pagehide disables automatic reload; pageshow re-enables it. Manual refresh remains unchanged. Actual emitted-script tests cover stale offline events, departure/history restoration and manual refresh.

18 focused tests pass. Production build passes. Actual mobile and desktop offline-pass journeys pass in 18.4 seconds, including all themes at 375/768/1280, pointer/keyboard refresh, exact uncached B URL/no-A-content, history restoration and genuine reconnect revocation/cache removal. Screenshots are isolated under ignored artifacts/TICKET-248/offline-pass. Independent source review is clean. No privacy threshold or timeout was weakened.

## Remaining

Commit evidence/ticket updates through normal hooks, run t:pr to record PR metadata and move to review, then monitor required hosted CI. Parent coordinates compiler slots. The source is already published; evidence updates currently await a normal hook slot. Physical device QA remains a release requirement.

The owned native PostgreSQL instance at port23661 is stopped, with data files preserved at /tmp/TICKET-248-native-pg. No collaborator stack was touched. No migration or production data change is part of this ticket.
