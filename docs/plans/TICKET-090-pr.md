## Problem and result

Administrators can view households but need a safe way to add and correct invitation details. This adds authenticated create/edit pages linked from Guests, with named guests, contact validation, household side/table and extra tag-along allowance. New invitations get a fresh capability and draft status. Only untouched drafts may be deleted; published invitations use revocation.

## Changes

- Validate every submitted field and authorize mutations with the current admin session.
- Lock the invitation and compare a fingerprint covering current members, reply and admission counter before editing.
- Preserve invitation capabilities, member meals/dietary notes and the guest's yes/no reply. Explicit attending-roster corrections update party size, preserve the original reply timestamp, and append admin-attributed RSVP history. Never shrink below admitted people.
- Retain local optimistic-concurrency fingerprints across refreshes and replace newly generated member IDs after save.
- Refresh editor lifecycle controls after revoke/reissue.

## Acceptance criteria and evidence

- Draft/token creation planning and contact validation pass unit tests. Actual PostgreSQL creation and deletion verification pending.
- Invalid contact error focus, retained input, stale form fingerprints, subsequent-save identities and published deletion restrictions pass component/action tests.
- End-to-end create/edit and invalid contact checks pending.

## Validation

- 18 unit/action/form tests pass.
- TypeScript passes.
- Lifecycle editor-route invalidation regression reproduced before fix.
- Database, browser, screenshots, axe and final quick verification pending. CI full verification required.

## Risks and limitations

Unfinished draft: no claim of completed browser or database verification. Existing RSVP history receives explicit admin actors; existing guest callers retain their default actor. Physical devices and release QA remain tracked separately. No migration or production database application.

## Review steps

Sign in as an allowed admin with two-factor authentication. Open Guests, choose Add an invitation, check invalid phone/email errors, create a draft, edit its household/members, and verify draft deletion confirmation. For a published invitation confirm permanent deletion is absent and revoke/reissue remain available.

## Rollback

Revert this ticket's routes and module changes. No schema or data migration is introduced.
