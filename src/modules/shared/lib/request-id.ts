import { z } from "zod";

// Correlation metadata only: bounded printable IDs, never an authorization signal.
const requestIdSchema = z
  .string()
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);

export function parseRequestId(value: unknown): string | undefined {
  const parsed = requestIdSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
