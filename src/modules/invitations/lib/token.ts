import "server-only";

import { randomBytes } from "node:crypto";
import { z } from "zod";

// Accept earlier 128-bit tokens; new invitations use 256 random bits.
export const invitationTokenSchema = z
  .string()
  .min(22)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}
