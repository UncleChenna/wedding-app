# Ticket

Ticket: TICKET-129

# Summary

The security review found two request-boundary weaknesses: station moves accepted hostile same-site origins, and five JSON handlers buffered oversized bodies before rejecting them. Both are fixed with regression tests. The report inventories every Server Action and route at the reviewed develop baseline, including recently merged staff orders and recovery imports.

# Changes

- Review report covers 38 exported actions in 21 files and 35 route handlers: authorization, IDOR/capabilities, input validation, mutation origins, privacy, token signing, offline recovery and deployment limits.
- Station mutations require exact Origin before body parsing or writes. Valid same-origin outcomes remain unchanged.
- Shared streamed JSON reader enforces byte limits before retaining further chunks; content-length is only an early rejection hint. Guest/staff orders, station moves, gate admission/read and offline sync use it.
- Production dependency audit returned zero advisories; no dependency/schema/RLS changes.

# Acceptance criteria and evidence

- [Audit report](../audits/TICKET-129-security-review.md) enumerates every discovered action and route with the checked boundary and limitations.
- [Dependency audit](../audits/TICKET-129-dependencies.json) records zero high/critical advisories across 215 production/optional dependencies on 13 November 2026.
- SEC-129-01 and SEC-129-02 are moderate findings fixed in this PR; six failing regressions now pass. No unresolved high/critical finding was identified in the reviewed scope. Future high/critical findings must block release until fixed and retested; a follow-up ticket alone is insufficient.

# Verification

- Initial security regression run: 6 failed, reproducing both findings.
- Focused request/body/handler suite: 69 passed across 7 files.
- Existing security suite: 166 passed across 19 files.
- `pnpm verify:quick`: lint/types pass; 80 related tests pass. 15 opt-in database tests skipped because no local database was started; no claim those ran locally.
- Independent bounded review: clean; streamed byte limits, reader cleanup, authentication ordering and station Origin checks inspected.
- Source reviewed against develop 6b2c9d3ec67fcf2ae83250cf3b34c84c0da9ac42. Required hosted CI remains mandatory before merge. No repeated full local build or physical-device run.

# Risks and rollout

No database migration, RLS, dependency, secret or service-account change. Normal browser station requests include Origin; external scripts must now send the correct same-origin value. Request-body caps retain existing 8 KB / 128 KB policies and add 4 KB to station moves. Malformed or unreadable bodies return existing validation responses; valid domain operations and role checks are preserved. Reverting reopens the reported findings and invalidates the cleared audit conclusion.

The report is not an external penetration test or production configuration certification. Existing release tickets still cover physical phones, provider configuration, key rotation, network infrastructure and offline reconciliation drills. The existing inline-script CSP tradeoff remains documented in ADR 0006.

# Screenshots

Not applicable: no rendered UI/layout changes. New station error copy is limited to invalid-origin requests; no successful flow appearance changes.

# UI checklist

Not applicable to this server-boundary/audit change. Physical-device release gates remain unchanged.

# Harness changes, if any

No workflow, hook or verification policy changes. A focused regression file under scripts exercises multiple feature response boundaries without introducing forbidden feature-to-feature production imports.
