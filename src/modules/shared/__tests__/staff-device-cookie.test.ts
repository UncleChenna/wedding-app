import { randomBytes } from "node:crypto";
import { expect, it } from "vitest";
import { createStaffDeviceCookie, readStaffDeviceCookie } from "../server/staff-device-cookie";

it("accepts only a signed device identity with the original key", () => {
  const key = randomBytes(32);
  const first = createStaffDeviceCookie(key);
  const second = createStaffDeviceCookie(key);
  expect(first.id).not.toBe(second.id);
  expect(readStaffDeviceCookie(first.cookie, key)).toBe(first.id);
  expect(readStaffDeviceCookie(first.cookie, randomBytes(32))).toBeNull();
  expect(readStaffDeviceCookie(first.cookie.replace(first.id, second.id), key)).toBeNull();
  expect(readStaffDeviceCookie(first.id, key)).toBeNull();
  expect(readStaffDeviceCookie(first.cookie + ".extra", key)).toBeNull();
  expect(() => createStaffDeviceCookie(Buffer.alloc(0))).toThrow();
});
