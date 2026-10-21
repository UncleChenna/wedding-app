# Request-scoped action logging

Use `runLoggedAction` inside each feature Server Action. It reads the request headers asynchronously, accepts a bounded `x-request-id` (1–64 ASCII letters/digits/underscores/hyphens, starting with a letter or digit), or generates a UUID. The ID is correlation metadata supplied by the caller or infrastructure, never proof of identity or authorization. Duplicate/comma-separated, malformed or oversized values are discarded.

```ts
"use server";

import { runLoggedAction } from "@/modules/shared/server/action-logger";

export async function exampleAction() {
  return runLoggedAction({ module: "invitations", action: "example" }, async (log) => {
    // Validate external inputs and authorize here before any data access.
    log.info("validation completed");
    return { ok: true };
  });
}
```

The helper is `server-only`, not itself a remotely callable Server Action. Call it per invocation, outside cached functions. Keep the request child local and pass it to nested operations through `log.child({ operation: "..." })`; never save it in global state. Every emitted lifecycle/handler/child log carries the same request ID, and later fields cannot replace it. Concurrent calls keep independent IDs. Existing log-level filtering still applies.

The wrapper emits `action started`, `action returned`, or `action threw`, with module/action labels and elapsed milliseconds on the terminal event. A returned domain error still counts as a returned result, not business success. Return values and thrown objects pass through unchanged. Next control-flow throws also pass through unchanged; the generic throw event is not a classification of their business meaning.

Do not log raw inputs, results, request headers, invitation URLs, dietary notes, names, email addresses, PINs, tokens or arbitrary exception messages. Use constant messages and explicitly selected non-sensitive fields. Sensitive key names (`token`, `password`, `secret`, authorization/cookies/API keys) are redacted recursively; structures beyond the serialization limit are replaced by `[truncated]`, never emitted raw. Key-based redaction cannot recognize secrets hidden in ordinary free-text messages or innocuously named fields. The action wrapper therefore logs neither arguments/results nor exception text/stack automatically. The general logger's explicit Error serialization remains available for carefully sanitized errors.

There are currently no feature Server Actions in this bootstrap, so no action endpoints were added or migrated for TICKET-141. Future action tickets must use this helper and cover their own validation, authorization and safe log fields. Client error-boundary logging remains separate and does not gain access to server request headers.

Verification: `src/modules/shared/__tests__/action-logger.test.ts` covers lifecycle lines, nested child redaction, concurrent isolation, invalid/missing IDs, fresh UUIDs and error propagation. `logger.test.ts` covers immutable request binding and deep redaction limits. Log shipping is outside this ticket.
