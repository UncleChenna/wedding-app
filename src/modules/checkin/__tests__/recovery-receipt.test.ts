import { expect, it } from "vitest";
import { signRecoveryReceipt, verifyRecoveryReceipt } from "../server/recovery-receipt";
const key = Buffer.alloc(32, 7),
  now = 1_800_000_000_000;
const receipt = {
  version: 1 as const,
  expiresAt: now + 1000,
  entries: [
    {
      actor: { staffId: "11111111-1111-4111-8111-111111111111", deviceId: "a".repeat(64) },
      digest: "b".repeat(64),
      ack: {
        clientEventId: "22222222-2222-4222-8222-222222222222",
        status: "recorded" as const,
        result: "valid" as const,
        admitted: 1,
        conflict: false,
      },
    },
  ],
};
it("accepts exact signed acknowledgements and rejects altered, expired or wrong-key receipts", () => {
  const token = signRecoveryReceipt(receipt, key);
  expect(verifyRecoveryReceipt(token, key, now)).toEqual(receipt);
  expect(verifyRecoveryReceipt(`x${token}`, key, now)).toBeNull();
  expect(verifyRecoveryReceipt(token, Buffer.alloc(32, 8), now)).toBeNull();
  expect(verifyRecoveryReceipt(token, key, now + 1000)).toBeNull();
  expect(verifyRecoveryReceipt("x".repeat(300_000), key, now)).toBeNull();
});
