# Proposed CI job: guest journey

TICKET-131 requires both mobile and desktop journeys to pass in CI. The existing browser job has no database, so the new database-backed test is intentionally run through a dedicated runner, not silently counted as covered by the general smoke job.

Proposed addition to `.github/workflows/ci.yml`, under `jobs` (existing jobs and permissions unchanged):

```yaml
guest-journey:
  name: invitation journey (mobile + desktop)
  runs-on: ubuntu-latest
  timeout-minutes: 15
  services:
    postgres:
      image: postgres:17
      env:
        POSTGRES_PASSWORD: postgres
      ports:
        - 54322:5432
      options: >-
        --health-cmd "pg_isready -U postgres"
        --health-interval 5s
        --health-timeout 5s
        --health-retries 10
  steps:
    - uses: actions/checkout@v7
    - uses: pnpm/action-setup@v6
    - uses: actions/setup-node@v7
      with:
        node-version-file: .nvmrc
        cache: pnpm
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps chromium
    - run: pnpm db:migrate
    - run: pnpm build
    - run: pnpm exec tsx scripts/test-guest-journey.ts
    - if: failure()
      uses: actions/upload-artifact@v7
      with:
        name: guest-journey-report
        path: |
          playwright-report/
          test-results/
        retention-days: 7
```

Uses existing workflow local-development environment values and pinned action versions already in the repository. Generates ephemeral signing keys only in child process environment; no new account, repository secret, production database or deployment. One Playwright worker keeps singleton event settings isolated between the mobile and desktop runs. Fixtures use a test venue guard and retire only IDs created by this test, preserving immutable RSVP history.

Costs: one additional hosted CI job per existing CI trigger. Rollback: remove this job; do not claim TICKET-131 acceptance without passing both projects. Requires the explicit CI-change approval in AGENTS.md before applying.
