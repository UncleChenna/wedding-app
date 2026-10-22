import "server-only";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { logger, type Logger } from "../lib/logger";
import { parseRequestId } from "../lib/request-id";

/** Call inside each Server Action; never cache the logger or request headers. */
export async function runLoggedAction<T>(
  context: { module: string; action: string },
  run: (log: Logger) => Promise<T>,
): Promise<T> {
  const requestHeaders = await headers();
  const requestId = parseRequestId(requestHeaders.get("x-request-id")) ?? randomUUID();
  const log = logger.child({ ...context, requestId });
  const started = performance.now();
  const durationMs = () => Math.round(performance.now() - started);
  log.info("action started");
  try {
    const result = await run(log);
    // Returned domain errors are normal results; do not label them business success.
    log.info("action returned", { durationMs: durationMs() });
    return result;
  } catch (error) {
    // Exception messages/stacks may contain tokens or personal input. Do not log them.
    log.error("action threw", { durationMs: durationMs() });
    throw error;
  }
}
