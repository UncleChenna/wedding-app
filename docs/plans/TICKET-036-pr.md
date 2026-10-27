# Ticket

Ticket: TICKET-036

# Summary

Personal invitation URLs previously returned 404. This change creates secure invitation tokens, resolves the named invitation on the server, and returns the same neutral HTTP 404 for unknown, draft and revoked tokens. The new page shows Uchenna and Adaora, 19 December 2026, and the invitation's primary guest names. Venue/time remain TBD; full design, RSVP and entry passes are downstream work.

# Changes

- 256-bit URL-safe tokens, validated input and at most five atomic uniqueness retries. Database outages propagate rather than masquerading as collisions.
- Drizzle draft creation and a guest-only projection that excludes contact details, staff notes and database IDs.
- A narrowly matched Proxy checks published-token existence before Next.js starts streaming. The page independently rechecks access. Missing tokens rewrite to a fixed unmatched path and the existing themed 404.
- Private no-store, no-referrer and noindex response headers; generic metadata without guest details.
- Token/resolver unit tests, isolated database lifecycle tests and mobile/desktop browser coverage, with fixture cleanup and no shared-data mutation.

# Acceptance criteria and evidence

- 10,000 token samples: unique, URL-safe and 32 decoded random bytes; bounded collision retry tests pass.
- Real PostgreSQL draft/sent/revoked lifecycle passes. Production browser checks prove valid 200, identical unknown/revoked 404, and a previously visited invitation becoming unavailable after revocation.
- Guest links contain no database identifiers. The public route contains only the random token.
- Detailed evidence and 12 inspected screenshots: [review](https://github.com/UncleChenna/wedding-app/blob/TICKET-036/docs/reviews/TICKET-036/README.md).

# Verification

20 token/resolver tests pass; two real database tests pass. Initial production route suite: eight passes, including both themes at 375/768/1280 with axe, overflow and keyboard checks. Production build and quick gate pass. A keyboard test initially failed with body-focus setup; the replacement verifies Tab from a visible heading reaches the exact return link.

First full gate: 301 unit/database passes, build passed, 173 browser passes, 17 conditional skips, two route-inventory failures. Added the missing dynamic-route sample without weakening the inventory guard. Next run: 300 passes and an existing DB query timed out at the unchanged five-second limit. Stopped only completed TICKET-034/TICKET-195 stacks with backups preserved after observing 54 Docker containers. Recovery gate: all 301 unit/database tests and build passed; 181 browser passes, 18 conditional skips, one failed status assumption for the new invalid fixture. The fixture now explicitly expects 404 while all other pages still require 200; its targeted overflow check passes. CLS is 0 and link dimensions are at least 44px on both browser projects. Final t:pr full gate remains pending; no complete gate pass is claimed yet.

# Risks and rollout

No migration, dependency, RLS or CI change. Revert this commit to remove the personal route; existing database schema remains unchanged. Only published statuses (sent, rsvp_yes, rsvp_no) are accessible; drafts are intentionally unavailable. This adds an existence lookup before rendering and a separate page query, with no cache of private data. Rate limiting remains TICKET-123, the polished invitation TICKET-037, and RSVP/pass issuance their own tickets. No invitation is sent or activated by this PR. `/invitation-unavailable` must stay unmatched to preserve the neutral 404 rewrite.

# Screenshots

Twelve images in `docs/reviews/TICKET-036/`: valid and unavailable states, ivory-gold and midnight-champagne, 375/768/1280. All inspected. See the review for links.

# UI checklist

Automated responsive, keyboard, contrast and reduced-motion evidence passes. The review records every checklist item. Lighthouse and physical WhatsApp/iOS/Android QA are not verified; track them under TICKET-201 using the user's existing authorization to merge previews with remaining release QA separate. This is not wedding-day release approval. CLS and tap-target assertions pass. Final full-gate result remains pending.

# Harness changes

The required accessibility route inventory entry and its explicit 404 status expectation were added. No checks, hooks or timeouts were relaxed. Database-dependent suites explicitly opt in and verify the managed local database address; ordinary CI skips are not presented as database evidence.
