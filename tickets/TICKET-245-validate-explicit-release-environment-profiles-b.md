---
id: TICKET-245
title: Validate explicit release environment profiles before deployment
epic: deployment
status: in_progress
priority: high
estimate: M
labels: [infra, security, test]
module: shared
owner: divine
agent: codex
blocked_by: []
blocks: []
branch: TICKET-245
pr: ""
created: 2026-11-13
updated: 2026-11-13
started: 2026-11-13
completed: ""
reason: ""
resume_to: ""
---

# TICKET-245: Validate explicit release environment profiles before deployment

## Context

The current shared runtime schema intentionally allows disabled staff, signing and alert capabilities during local work. It cannot alone prove a release environment is configured. [TICKET-148](TICKET-148-define-and-validate-environment-variables-per-en.md) also requires provider configuration and deployed startup evidence that remain blocked on external setup. This ticket implements only the reusable local preflight and documentation parity portion, following [the architecture](../docs/prd.md#tech-stack-and-architecture).

## Scope

- Add an explicit preview/production release-profile validation command using documented environment names and existing feature validation boundaries.
- Validate required release capabilities, HTTPS deployment URLs and safe public-variable names without changing local/CI runtime defaults or printing values.
- Document each application variable, profile requirements and optional feature configuration; test parity against `.env.example`.
- Add this implementation as a prerequisite to TICKET-148 while preserving every provider/deployment acceptance criterion and existing prerequisite.

## Out of scope

- Provisioning services, setting provider secrets, secret rotation, network deployment, database changes or certifying an actual preview/production environment.
- Requiring currently optional release secrets during ordinary local builds or CI tests.

## Acceptance criteria

- [x] Explicit release profiles reject missing or malformed required configuration with field names and redacted reasons only.
- [x] Local runtime schema defaults and feature-disabled behavior remain unchanged.
- [x] Release URL and public-variable checks reject unsafe or local deployment configuration without exposing supplied credentials or values.
- [x] Application-variable documentation and `.env.example` remain in tested parity, distinguishing test-only flags from application configuration.
- [x] TICKET-148 retains provider setup and actual deployed startup verification, with this code prerequisite linked; no provider task is marked complete by these tests.

## Test plan

- Unit: valid synthetic profiles, missing required capabilities, malformed signing input, local/insecure URLs, optional settings and redaction.
- Integration: invoke the command with synthetic environments and assert exit status and redacted output; documentation parity.
- Gate: normal quick verification and independent review; required CI before merge.

## Files likely touched

- `scripts/` release preflight entry and tests
- `src/modules/shared/lib/env/` reusable profile validation
- `docs/deployment.md`
- `.env.example`
- `package.json`
- `tickets/TICKET-148-define-and-validate-environment-variables-per-en.md`

## Notes / decisions

2026-11-13: Authorized split from provider-dependent TICKET-148. Primary checkout has no Vercel project metadata or deployment document, and GitHub reports no environments/deployments; these observations do not prove an external provider project does not exist. No provider configuration will be inferred or changed.

## Activity log

- 2026-11-13 — created as a code-only prerequisite; provider evidence remains mandatory.
- 2026-11-13 — todo → claimed — divine (codex)
- 2026-11-13 — todo → in_progress — divine (codex)
