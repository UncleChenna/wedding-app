import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const PIN = /^[0-9]{6}$/;
const PREFIX = "scrypt$32768$8$1";
const ENVELOPE = /^scrypt\$32768\$8\$1\$([0-9a-f]{64})\$([0-9a-f]{128})$/;

function derive(pin: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

/** Server-side credential creation; callers must never log the PIN or envelope. */
export async function hashStaffPin(pin: string): Promise<string> {
  if (!PIN.test(pin)) throw new Error("Staff PIN must contain exactly six digits");
  const salt = randomBytes(32);
  const digest = await derive(pin, salt);
  return `${PREFIX}$${salt.toString("hex")}$${digest.toString("hex")}`;
}

/** Only the supported cost is accepted; stored parameters cannot request unbounded work. */
export async function verifyStaffPin(pin: string, encoded: string): Promise<boolean> {
  if (!PIN.test(pin)) return false;
  const match = ENVELOPE.exec(encoded);
  if (!match?.[1] || !match[2]) return false;
  const actual = await derive(pin, Buffer.from(match[1], "hex"));
  return timingSafeEqual(actual, Buffer.from(match[2], "hex"));
}
