import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const identitySchema = z.strictObject({
  staffId: z.uuid(),
  role: z.enum(["gate", "kitchen", "bar", "host"]),
  credentialVersion: z.number().int().positive(),
});
const sessionSchema = identitySchema.extend({
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});

export type StaffSessionIdentity = z.infer<typeof identitySchema>;

function signature(body: string, device: string, key: Buffer): Buffer {
  return createHmac("sha256", key)
    .update(JSON.stringify(["wedding-staff-session-v1", device, body]))
    .digest();
}

export function signStaffSession(
  identity: StaffSessionIdentity,
  device: string,
  expiresAt: Date,
  key: Buffer,
  now = new Date(),
): string {
  if (key.length < 32 || !device || device.length > 200) {
    throw new Error("Invalid staff session signing configuration");
  }
  const payload = sessionSchema.parse({
    ...identity,
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(expiresAt.getTime() / 1000),
  });
  if (payload.exp <= payload.iat) throw new Error("Staff session must expire in the future");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signature(body, device, key).toString("base64url")}`;
}

/** Authentication also requires a live database check of role, version and revocation. */
export function readStaffSession(
  token: string,
  device: string,
  key: Buffer,
  now = new Date(),
): z.infer<typeof sessionSchema> | null {
  if (key.length < 32 || !device || device.length > 200 || token.length > 2048) return null;
  const match = /^([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match?.[1] || !match[2]) return null;
  const [body, supplied] = [match[1], match[2]];
  const digest = Buffer.from(supplied, "base64url");
  if (digest.toString("base64url") !== supplied) return null;
  if (!timingSafeEqual(signature(body, device, key), digest)) return null;
  try {
    const decoded: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const result = sessionSchema.safeParse(decoded);
    if (!result.success) return null;
    const seconds = Math.floor(now.getTime() / 1000);
    if (!Number.isFinite(seconds) || result.data.iat > seconds || result.data.exp <= seconds) {
      return null;
    }
    if (result.data.exp <= result.data.iat) return null;
    return result.data;
  } catch {
    return null;
  }
}
