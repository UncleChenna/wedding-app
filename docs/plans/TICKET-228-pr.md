# Ticket

Ticket: TICKET-228

# Summary

Every ticket carries the same fixed cost, whatever its size: a worktree, a database stack, a production build,
browser tests, a PR and about 20 minutes of CI. At the owner's request (2026-11-12), this folds 17 tickets that
hadn't started into 11 tickets covering the same flow. The scope doesn't change; the open list shrinks from 85 to
68, and about 11 PRs fewer will be needed.

# Changes

| Keeps going                           | Absorbs                                                | Why                                      |
| ------------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| TICKET-085 alert sending with retries | 087 alert health on boards                             | 087 shows 085's results                  |
| TICKET-111 update prompt              | 180 queued data across upgrades                        | Same service-worker upgrade path         |
| TICKET-116 Lighthouse gate            | 121 layout-shift and console-error gate                | Same guest-page test setup               |
| TICKET-014 couple's theme             | 038 hero photo, 119 image optimisation                 | All wait on the owner's photos (008)     |
| TICKET-126 privacy notice             | 127 retention deletion job                             | Both carry out the 122 decision          |
| TICKET-129 security review            | 124 headers and CSP                                    | Headers are part of the review           |
| TICKET-149 preview/staging database   | 213 worktree databases                                 | One decision on non-production databases |
| TICKET-150 migrations in the pipeline | 152 smoke tests per deploy                             | Same pipeline                            |
| TICKET-132 gate end-to-end            | 136 gate end-to-end offline                            | Same test setup                          |
| TICKET-145 Vercel project             | 144 Supabase, 146 domain, 147 builds, 148 environments | One platform setup                       |
| TICKET-114 real-device install        | 138 WhatsApp, 201 guest QA, 206 MFA on phones          | One real-device test session             |

For each pair:

- **Survivor:** it gets each absorbed ticket's scope, criteria and test plan. Criteria are tagged "(from TICKET-x)"
  so nothing is lost. It also gets the combined dependencies (with links inside the group dropped) and size L.
- **Absorbed ticket:** it's cancelled, with the reason "Merged into TICKET-x (TICKET-228)", in both the file and the
  shared ledger.
- **Dependents:** unstarted tickets that depended on an absorbed ticket now depend on its survivor.

**Left alone:**

- **Started or finished tickets:** any ticket that's started, claimed, in review or done, including Codex's in-flight
  gate work. A cancelled id may remain in those tickets' `blocks` lists; that's cosmetic and doesn't block
  anything.
- **Merges that would break the size-L limit:** 117+118, and 151+179+153.
- **Tickets on different timelines:** 157 (menu) and 177 (guest list).

# Acceptance criteria and evidence

- [x] **All 17 absorbed tickets are cancelled with a "Merged into" reason, and their criteria appear in the
      survivor.** `pnpm t:list` shows all 17 as `cancelled`, and each survivor lists "(from TICKET-x)" criteria.
- [x] **No unstarted ticket is blocked by a cancelled ticket, and `pnpm t:validate` passes.**
  - `t:validate`: 224 tickets valid.
  - A grep of todo and backlog tickets for blockers among the cancelled ids found none.
- [x] **No started, claimed or finished ticket file is changed.** The diff contains only todo (30) and cancelled
      (17) ticket files, plus TICKET-228.

# Verification

- `pnpm t:validate`: 224 tickets valid.
- No code changed; CI's `pnpm verify` covers the rest.

# Risks and rollout

- **The combined tickets are larger** (size L), so each PR will be bigger to review.
- **Rollback:** revert the PR, and move the 17 tickets from `cancelled` back to `todo` in the ledger.

# Screenshots

N/A: no UI.

# Harness changes, if any

None. The ticket files were edited with a one-off script, not a new tool.
