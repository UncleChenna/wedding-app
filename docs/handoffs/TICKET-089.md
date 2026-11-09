# TICKET-089 — 2026-11-09

Owner divine; branch TICKET-089; base develop9e9c2ca (integrated after initial37e9202c). Started through
`t:start --ahead`; TICKET-043 is active and is the sole unfinished prerequisite.
Keep this PR draft until043 merges. No database has been started for089 yet.

Implemented a private `/admin/guests` reader/page and dashboard entry, combined
name/status/sent/side/table filters, compact household rows and lazily mounted
sharing controls. Server authorizes before all data/settings reads and excludes
contacts/internal notes/raw tokens from the view model. Failed reads show a retry
state rather than an empty list. Reuses the existing full-page RetryButton.

Evidence: 11 focused tests passed; quick gate passed lint/types and112related tests
(one opt-in skip). Explicit filter/reader/component tests cover combined filters,
unset values, sent-vs-reply semantics, authorization denial, household grouping,
storage failure and refreshed sharing URL. Initial accessible-label test failed
because adjacent text joined words; fixed explicit label, unchanged test passed.
Early independent review found long side values needed wrapping; corrected before
browser checks, with a long-side fixture still to add.

Integrated dependency043 final31cbd8c0 and develop9e9c2ca; preserved both Guests
and Themes dashboard links. Added lifecycle controls, guest-route invalidation,
six-section mobile navigation and focus recovery when a revoked row is filtered
away. Latest quick gate passes lint/types and eight related tests (three files).

Remaining: authenticated browser fixtures,
300-invitation initial-render/filter measurement (<200ms), mobile screenshots and
all-theme axe/contrast, keyboard/reduced-motion/overflow checks, full CI and final
independent review. No UI or performance acceptance is claimed complete.

Setup-generated template drift was restored before the initial feature commit.
