import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { recoveryReceiptSchema, type RecoveryReceipt } from "../lib/recovery";
const domain = "wedding-recovery-ack-v1\0";
export function signRecoveryReceipt(receipt: RecoveryReceipt, key: Buffer): string {
  if (key.length < 32) throw new Error("Recovery signing unavailable");
  const body = Buffer.from(JSON.stringify(recoveryReceiptSchema.parse(receipt))).toString(
    "base64url",
  );
  const mac = createHmac("sha256", key).update(domain).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function verifyRecoveryReceipt(
  token: string,
  key: Buffer,
  now = Date.now(),
): RecoveryReceipt | null {
  if (key.length < 32 || token.length > 256 * 1024) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1] || !/^[A-Za-z0-9_-]{43}$/.test(parts[1]))
    return null;
  try {
    const mac = Buffer.from(parts[1], "base64url");
    const expected = createHmac("sha256", key).update(domain).update(parts[0]).digest();
    if (mac.length !== expected.length || !timingSafeEqual(mac, expected)) return null;
    const parsed = recoveryReceiptSchema.safeParse(
      JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")),
    );
    return parsed.success &&
      parsed.data.expiresAt > now &&
      parsed.data.expiresAt <= now + 24 * 60 * 60 * 1000
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
