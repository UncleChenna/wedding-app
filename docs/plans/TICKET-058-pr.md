# Ticket

Ticket: TICKET-058

# Summary

Gate admission is "the logic that must never be wrong" (PRD CHK-2, CHK-3). This adds `decideAdmission`, one pure
function that both the server and the offline scanner will run. From an invitation, the pass's token version, the
people already admitted and the number entering now, it returns:

- one of the PRD results (Valid, Already used, Invalid, Revoked, Not RSVP'd)
- how many people to admit, and how many remain

An invitation for 4 can admit 2 now and 2 later. It becomes "used" only when the allowance is reached.

# Changes

- **`src/modules/checkin/lib/admission.ts`** (new), with no imports so it can run on scanner devices:
  - A draft invitation, an unknown one, or a pass version newer than the invitation's: `invalid`.
  - A revoked invitation, or an older pass replaced by a reissue: `revoked`.
  - Not a yes, not attending, or fewer than one person: `not_rsvped`.
  - Nobody left to admit: `already_used`.
  - No count given: the whole remaining party is admitted.
  - A count that isn't a whole positive number: `bad_count`, admitting nobody.
  - More people than remain: `too_many`, admitting nobody. A partial admission is never applied silently.
  - On success it returns `admit`, `admittedAfter` and `remaining`, and `fullyUsed` once the allowance is reached.
  - An inconsistent counter (above the allowance or negative) can never create extra room.
- **`src/modules/checkin/__tests__/admission.test.ts`** (new):
  - every result type
  - the boundaries: 0, partial, exact and over-admit
  - bad counts and inconsistent counters
  - a seeded property test of 2,000 random parties, each with 15 random scans
- **`src/modules/checkin/README.md`:** a pointer to the function.

# Acceptance criteria and evidence

- [x] **Every result type and boundary (0, partial, exact, over-admit) has a unit test; branch coverage 100%.**
  - There are 9 tests.
  - Each branch of `decideAdmission` has its own test case: each refusal condition, both clamps, default and
    explicit counts, `bad_count`, `too_many`, and `fullyUsed` both true and false.
  - **Coverage wasn't machine-measured:** no coverage tool is installed, and adding one would change the lockfile.
    The 100% claim comes from listing every branch by hand.
- [x] **Over-admission is impossible in the function and in the DB constraint.**
  - The function returns `admit: 0` whenever the request exceeds what remains.
  - The database check `admission_counters_bounded` (`admitted_people <= allowance`, TICKET-024) refuses an
    over-admitting write. It's already exercised in `scripts/__tests__/admission-storage.integration.test.ts`
    ("rejects a forged allowance and an RSVP reduction below accepted admissions").
- [x] **Property test: any sequence of admissions never exceeds count_attending.**
  - Over 2,000 seeded random parties (0 to 11 people, 15 scans each, with random, missing, negative and oversized
    counts), the running total never exceeds `count_attending`.
  - `fullyUsed` is true exactly at the allowance, and the next scan says `already_used`.

# Verification

- `vitest run src/modules/checkin/__tests__/admission.test.ts`: 9 passed.
- `tsc` and ESLint: clean. `verify:quick` runs in `t:pr`; CI runs the full `pnpm verify`.

# Risks and rollout

- **Not wired in yet:** nothing calls the function until the scan flow is built (TICKET-057 on the scanner and TICKET-060 for results), so
  nothing changes at runtime.
- **Rollback:** revert the PR.

# Screenshots

N/A: no UI (out of scope).

# UI checklist

N/A: no UI.

- [x] **Verification:** see above.

# Harness changes, if any

None.
