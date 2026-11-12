# Ticket

Ticket: TICKET-133

# Summary

PRD Journey 3, ordering from the table, now runs end to end in CI:

1. A guest orders a meal and a drink.
2. The kitchen and bar boards each get only their part.
3. Staff serve it, and the guest's confirmation follows.

It also checks one limit: the same table can't order again straight away.

Writing the test exposed a real race on the boards, which is fixed here: a quick second tap on a card could fail.

# Changes

- **`e2e/ordering-journey.spec.ts`** (new): two serial cases.
  - **Guest to boards to served:** the guest, kitchen and bar each use their own browser context.
    - The kitchen card shows "2 × meal" and the guest's note, and no drink. The bar card shows "1 × drink" and no
      meal.
    - An immediate second order from the guest gets the cooldown message.
    - After staff serve both tickets, the order's status in the database is `served`.
  - **The guest's confirmation follows the board:** "Being prepared", then "Served. Enjoy every bite."
  - **Self-contained:** it creates and removes its own staff, menu, tables and event settings, so it runs on CI's
    unseeded database.
- **`scripts/test-ordering-journey.ts`** (new): runs the spec with `RUN_ORDERING_JOURNEY=1` and a throwaway
  `STAFF_SESSION_SECRET`, the same pattern as `test-scanner-journey.ts`.
- **`.github/workflows/ci.yml`:** one step in the existing "invitation journey" job runs the journey script. This
  is a CI change; it adds a test step and nothing else.
- **`components/station-board.tsx`:** while a ticket's move is saving, that card's buttons are disabled.
  - **Before:** "Start preparing" then a quick "Served" sent the second move from the old status. The server
    correctly refused it as out of date, and the card snapped back with an error.

# Acceptance criteria and evidence

- [x] **The journey passes in CI with two browser contexts.** It runs in the CI journey job. Locally, against a
      production build:
  - **Without Realtime** (`SUPABASE_JWT_SECRET` empty, as in CI): 5 runs out of 5 passed, 11 to 17 s each. The
    boards caught up through their refetch fallback.
  - **With Realtime:** 3 runs out of 3 passed.
  - Before the board fix, it failed about 1 run in 3, always on the quick "Start preparing" then "Served" race.

# Verification

- `e2e/station-boards.spec.ts`: 3 passed on the same build, after the button change.
- `pnpm typecheck` and ESLint: clean.

# Not tested and limitations

- **No load testing:** that's TICKET-137.
- **Board catch-up in CI** relies on the refetch fallback, which takes up to about 30 s between refetches. The spec
  allows 45 s.

# Risks and rollout

- **CI time:** the step adds about 1 to 2 minutes to the 15-minute journey job.
- **Rollback:** revert the PR.

# Screenshots

N/A: no visual change (buttons only disable while saving).

# Harness changes, if any

The CI step above.
