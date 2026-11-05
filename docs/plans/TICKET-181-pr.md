# TICKET-181: validated theme drafts and atomic activation

The existing runtime only resolved preset IDs. This change adds validated draft
storage and explicit publication so draft edits cannot implicitly change live pages.

## Implementation

- AAL2 admin save/activate action boundaries, with safe expected-error responses.
- Canonical schema, curated-font, contrast, QR and semantic-status validation.
- Separate editable tokens and published snapshots; publication revalidates both
  schemes and identities and serializes updates in one database transaction.
- One-query published selection read before rendering, preserving preset fallback.
- Immediate active-theme cache expiry only after publication commits.

Generated migration adds one nullable published_tokens column. The user approved isolated testing/commit and the exact-path record is written.
It remains unapplied because the guarded database count query timed out; proposal: docs/reviews/TICKET-181/migration-approval.md.
This draft is not deployable without that migration and remaining verification.

## Evidence and remaining work

Focused boundary checks pass: draft validation7, publication validation4, and the
runtime/action quick gate21 passes/7 skips, with lint/types passing. Five database
fixture tests are prepared but have NOT run, including post-write rollback and
two-connection publication serialization. The first full gate caught fixture
transaction typing; that was fixed. The subsequent full gate FAILED: format/lint/types pass,1043 unit passes,99 skips
and3 hook-test failures. Those hook failures arose from the then-unapproved migration journal. After the
user approval was recorded, all43 focused hook tests pass without code changes. That gate did not reach build/browser stages. A separate production build now
passes; browser activation remains unverified.
No protection was bypassed. Full verification still needs rerunning; database is
unhealthy with only212MB VM memory available. Capacity recovery permission pending.

Required before review: approved isolated migration/repeat counts/RLS, real draft
isolation and concurrent activation, post-write rollback, initial HTML/artifact
checks, full verification and applicable UI evidence. No criteria are marked done.

## Risks and rollout

Base develop c9c9e66010ee773189477139d4f8b0d30cf481e1. Preserve the current
light/dark pair and safe preset fallback. Install the approved additive migration
before deployment; no production application is authorized here. Application
rollback retains the nullable column and snapshots. Pending migration0013 files in
other PRs require sequential integration and reviewed regeneration, never overwriting
applied SQL or journal entries. No dependency, CI or RLS-policy changes.
