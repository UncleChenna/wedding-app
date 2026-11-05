# TICKET-185: supply the limiter database to the existing verification job

Approval target: `.github/workflows/ci.yml` on branch TICKET-185 / PR89.

## Evidence

CI run41839168129, head a8f20cc: general verification failed twelve browser cases.
For example `/i/not-a-capability/offline-pass` expected404 but received503;
`/p/` expected its generic pass title but received the retry page. The verify job
has no PostgreSQL service, while DATABASE_URL points to localhost54322. The new
shared limiter intentionally returns503 when its database is unavailable.

The same integrated code passed locally with its isolated database: 985 unit tests,
779 browser checks, plus five explicit distributed limiter database cases. The
separate CI migrations and invitation-journey jobs passed because they provision
PostgreSQL. No production change or weakening of fail-closed behavior is proposed.

## Exact proposed workflow change

Add this existing service configuration to the `verify` job (matching the current
`database` job):

```yaml
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
```

After locked dependency installation and before `pnpm verify`, add:

```yaml
- name: Prepare the verification database
  run: pnpm db:migrate
```

Retain all existing jobs, steps, assertions, timeouts, least-privilege permissions
and failure artifacts. The existing public local database URL already matches this
service. No new secret, external account or paid service is needed. This service is
disposable and isolated to the CI job; it does not affect any local or production DB.

## Verification and rollback

Review workflow formatting and diff, run required local checks, push and require
all five CI jobs to pass on the resulting head. Do not merge based on old local
results. Reverting this workflow change restores the previous CI setup; no product
or migration rollback is involved. Physical-device release requirements remain.

Owner approved this exact repair on 2026-11-04. Applied without changing tests, timeouts, permissions or application behavior.
