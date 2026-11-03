import { describe, expect, it } from "vitest";

import { hashStaffPin, verifyStaffPin } from "../server/staff-pin";

describe("staff PIN credentials", () => {
  it("salts credentials independently and verifies six digits including leading zeroes", async () => {
    const first = await hashStaffPin("012345");
    const second = await hashStaffPin("012345");
    expect(first).not.toBe(second);
    expect(first).toMatch(/^scrypt\$[0-9]+\$[0-9]+\$[0-9]+\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(await verifyStaffPin("012345", first)).toBe(true);
    expect(await verifyStaffPin("012346", first)).toBe(false);
  });

  it.each(["12345", "1234567", "12345a", " 123456", "１２３４５６", ""])(
    "rejects malformed PIN %j without normalization",
    async (pin) => {
      await expect(hashStaffPin(pin)).rejects.toThrow("six digits");
      expect(await verifyStaffPin(pin, "malformed")).toBe(false);
    },
  );

  it.each([
    "",
    "123456",
    "scrypt$9999999$8$1$" + "ab".repeat(32) + "$" + "ab".repeat(64),
    "scrypt$32768$8$1$invalid$" + "ab".repeat(64),
    "scrypt$32768$8$1$" + "ab".repeat(32) + "$abc",
  ])("fails closed for corrupt or excessive-cost envelopes", async (encoded) => {
    expect(await verifyStaffPin("012345", encoded)).toBe(false);
  });
});
