# Secrets handling and rotation

TICKET-125. Applies to source and deployment configuration; it is not evidence that production credentials have been provisioned or rotated.

## Inventory and access

| Credential or setting                                                                | Storage and access                                                                                                                                                | Validation and exposure                                                                                                                                                      |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL, including its database password                                        | Deployment secret store; local ignored .env.local contains only the isolated disposable database credentials. Database/deployment operators only.                 | shared/lib/env/schema.ts validates the connection scheme; shared/server/env.ts is server-only. Never send the URL to the browser or logs.                                    |
| GATE_SIGNING_PRIVATE_KEY                                                             | Deployment secret store; optional throwaway local key. Only the signing runtime and designated key/deployment operators.                                          | checkin/server/signing.ts validates base64url PKCS#8 and Ed25519. Missing keys return an error result without preventing unrelated pages from starting.                      |
| GATE_SIGNING_KEY_ID and GATE_RETIRED_PUBLIC_KEYS                                     | Deployment configuration. Operators manage them alongside the private key.                                                                                        | Public identifiers and public verification material, not private secrets. Signing validates IDs, key types and duplicate IDs. /api/gate-keys publishes public material only. |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SITE_URL | Environment configuration, deliberately bundled into the browser.                                                                                                 | Only these three NEXT_PUBLIC names are approved. Publishable keys rely on Auth/RLS, not secrecy. Never substitute a secret/service-role key.                                 |
| Supabase secret/service-role API credentials                                         | Not consumed by this application today. Keep provider administrator credentials in the provider/deployment secret store, accessible only to authorized operators. | A future integration must add a named server-only schema and tests before use. No NEXT_PUBLIC variant is permitted.                                                          |
| WhatsApp API access tokens and webhook/app secrets                                   | No WhatsApp Cloud API sender/webhook exists here; current sharing opens the guest's client. Do not provision tokens for this flow.                                | Before an API integration lands, its ticket must add server-only validation, scoped operator access and provider-specific rotation verification.                             |
| Auth signing keys, SMTP credentials, CI/deployment access tokens                     | Managed by the corresponding provider or CI secret store, not browser configuration. No secret values belong in the repository.                                   | Application server environment validation does not validate provider-managed credentials. Provisioning remains a human/deployment prerequisite.                              |

Named operators and production access grants must be recorded during TICKET-148 setup. Repository access alone must not imply production-secret access. Never paste private material into tickets, PRs, chat, screenshots, command output or analytics. Do not commit generated credentials or real .env files. Share secret references through the approved secret store.

## Enforcement

The ESLint environment-boundary rule runs as part of pnpm lint and pnpm verify. Private environment reads require an import of server-only; the instrumentation startup validator is the explicit bootstrap exception. Client directives cannot borrow this exemption. Outside those boundaries, only literal approved public names, NODE_ENV and the shared logger's non-secret LOG_LEVEL read are allowed. Process/environment aliases and process imports are rejected. Next's server-only poisoning rejects client imports of protected modules during builds.

parseClientEnv rejects unapproved NEXT_PUBLIC names at startup, reporting names without values. This catches unsafe configuration even if a variable is not yet referenced in code. To add a legitimate public setting, review its data classification and update the schema, lint allowlist, example and tests together.

These checks prevent common accidental exposure; they are not a sandbox for malicious code, a literal-secret scanner or a guarantee that server code never returns private values. Review responses, logs and serialized props. Do not serialize serverEnv or raw process.env.

## Rotation procedure

For every rotation, record operator, environment, secret reference/version, reason, time, affected consumers, verification and revocation outcome—never the value. Test with disposable credentials first. A source-code rollback does not roll back provider credentials.

### Database password / DATABASE_URL

Identify every deployment, migration job and connection pool using the database role. Schedule the cutover with the database owner. Change the role password through the provider's supported procedure; update every secret-store connection URL with correct password encoding, then redeploy/reconnect consumers. Verify a new authenticated connection and normal database operations. Verify the previous password fails for a fresh connection; consider existing authenticated sessions separately. On compromise, revoke/terminate affected sessions with explicit authorization and investigate access. Prefer fixing forward with another new password over restoring a compromised one.

Use the provider's current connection format: [Supabase connection documentation](https://supabase.com/docs/guides/database/connecting-to-postgres).

### Gate signing key

Follow [ADR0021](decisions/0021-gate-signing-keys.md) and the offline contract in [ADR0020](decisions/0020-gate-pass-credential.md). Generate a new key using pnpm gate:keygen in a secure operator terminal; its output contains private material. Store it directly in the deployment secret store. Give it a new key ID. For routine rotation, retain the old public key in GATE_RETIRED_PUBLIC_KEYS, deploy, and verify new passes plus previously issued passes. Refresh every scanner's key ring before relying on the new key.

Do not remove an old public key until its passes are reissued or no longer needed. For compromise, remove the compromised key from publication, replace the signer, reissue passes and refresh every scanner. Offline devices may retain the compromised public key: removal on the server alone cannot revoke their cached trust. Quarantine stale devices or use the documented staffed fallback until refresh is confirmed. Never restore a compromised private key as rollback. Device refresh/reissue workflows must be implemented and rehearsed before guest release.

### Supabase API and Auth keys

For a secret API key, create a replacement, update all backend consumers, verify them and revoke the old key. A publishable key is not a service credential. Legacy service-role/JWT credentials have different migration and revocation behavior; do not assume creating a new key disables the old one. Follow [Supabase's leaked-key rotation procedure](https://supabase.com/docs/guides/security/rotate-leaked-api-keys) and [Auth signing-key guidance](https://supabase.com/docs/guides/auth/signing-keys). Verify both replacement success and old-key rejection. Auth key changes require explicit session-impact planning. Do not alter RLS as part of credential recovery.

### Messaging, SMTP and deployment credentials

For an integration that uses these credentials: inventory consumers and webhook verification dependencies, obtain a replacement with minimum required permissions, update the server/provider secret store, redeploy/reload, verify an authorized synthetic operation, revoke the prior credential and verify rejection. Handle webhook signature-secret overlap only if the provider explicitly supports it. On compromise, contain access first and investigate sent messages or deployments; do not reactivate the old credential.

WhatsApp API provider-specific token lifecycle and webhook verification are launch prerequisites for that future integration, not tested functionality of this link-sharing application. No messages, production rotations or provider account changes were performed by this ticket.

## Verification limits

Negative lint tests cover direct/computed access, aliases, process imports, client/server boundary misuse and public secret names. Environment tests cover configuration rejection without value disclosure. Existing signing tests cover key validation, public-key publication and rotation semantics. Real provider rotations, scanner refresh and physical-device behavior require authorized operational rehearsal; unit tests do not certify them.
