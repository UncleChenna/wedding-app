import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function digest(id: string, key: Buffer) {
  return createHmac("sha256", key).update(`staff-device-v1:${id}`).digest("hex");
}
export function createStaffDeviceCookie(key: Buffer): { id: string; cookie: string } {
  if (key.length < 32) throw new Error("Invalid staff device signing key");
  const id = randomBytes(32).toString("hex");
  return { id, cookie: `${id}.${digest(id, key)}` };
}
export function readStaffDeviceCookie(cookie: string, key: Buffer): string | null {
  if (key.length < 32) return null;
  const match = /^([0-9a-f]{64})\.([0-9a-f]{64})$/.exec(cookie);
  if (!match?.[1] || !match[2]) return null;
  return timingSafeEqual(Buffer.from(digest(match[1], key), "hex"), Buffer.from(match[2], "hex"))
    ? match[1]
    : null;
}
