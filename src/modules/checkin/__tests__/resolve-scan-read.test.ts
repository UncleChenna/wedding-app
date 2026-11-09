import { generateKeyPairSync, sign } from "node:crypto";
import { expect, it, vi } from "vitest";
import { resolveScanRead } from "../lib/resolve-scan-read";
import { encodeGatePassPayload } from "../lib/gate-token";
const pair = generateKeyPairSync("ed25519");
const keys = [
  {
    kid: "test",
    alg: "Ed25519" as const,
    spki: pair.publicKey.export({ format: "der", type: "spki" }).toString("base64url"),
  },
];
const payload = {
  v: 1 as const,
  kid: "test",
  inv: "550e8400-e29b-41d4-a716-446655440000",
  ver: 1,
  iat: 0,
};
function qr(version = 1) {
  const body = encodeGatePassPayload({ ...payload, ver: version });
  return `https://wedding.example/p/${body}.${sign(null, Buffer.from(body), pair.privateKey).toString("base64url")}`;
}
const row = {
  status: "rsvp_yes",
  tokenVersion: 1,
  attending: true,
  countAttending: 4,
  primaryNames: ["Ada"],
  householdName: null,
  tableNumber: 7,
  admittedSoFar: 2,
  admissions: [],
};
it("uses actual signature verification then canonical admission rules without recording admission", async () => {
  const load = vi.fn(async () => row);
  const result = await resolveScanRead(qr(), "https://wedding.example", keys, load);
  expect(result).toMatchObject({
    state: "valid",
    guest: { partySize: 4, admittedSoFar: 2, tableNumber: 7 },
  });
  expect(load).toHaveBeenCalledWith(payload.inv);
});
it.each([
  "https://evil.example/p/code",
  "https://wedding.example/i/secret",
  "https://wedding.example/p/code?secret=x",
  "https://wedding.example/p/code#part",
  "not a url",
  "https://person@wedding.example/p/code",
  "https://:secret@wedding.example/p/code",
  "https://wedding.example/p/",
  "https://wedding.example/p/" + "a".repeat(513),
  "https://wedding.example/p/code/extra",
])("rejects %s without loading guest data", async (value) => {
  const load = vi.fn();
  expect(await resolveScanRead(value, "https://wedding.example", keys, load)).toEqual({
    state: "invalid",
  });
  expect(load).not.toHaveBeenCalled();
});
it.each([
  ["  Synthetic household  ", "Synthetic household"],
  ["   ", "Guest"],
  [null, "Guest"],
])("uses a readable fallback when the primary name is absent", async (householdName, name) => {
  expect(
    await resolveScanRead(qr(), "https://wedding.example", keys, async () => ({
      ...row,
      primaryNames: [],
      householdName,
    })),
  ).toMatchObject({ state: "valid", guest: { name } });
});
it("refuses a future signed version without displaying guest information", async () => {
  expect(await resolveScanRead(qr(2), "https://wedding.example", keys, async () => row)).toEqual({
    state: "invalid",
  });
});
it("rejects forged credentials before resolving identity", async () => {
  const load = vi.fn();
  const forged = qr().replace(/.$/, "!");
  expect(await resolveScanRead(forged, "https://wedding.example", keys, load)).toEqual({
    state: "invalid",
  });
  expect(load).not.toHaveBeenCalled();
});
it.each([
  [{ ...row, admittedSoFar: 4 }, "already_used"],
  [{ ...row, tokenVersion: 2 }, "replaced"],
  [{ ...row, status: "revoked" }, "revoked"],
  [{ ...row, status: "sent", attending: null, countAttending: 0, admittedSoFar: 0 }, "not_rsvped"],
  [{ ...row, status: "draft" }, "invalid"],
  [null, "unknown"],
  [{ ...row, admittedSoFar: 5 }, "unavailable"],
  [{ ...row, tableNumber: -1 }, "unavailable"],
  [{ ...row, dietaryNotes: "private" }, "unavailable"],
] as const)("maps current state to %s", async (value, state) => {
  expect(
    (await resolveScanRead(qr(), "https://wedding.example", keys, async () => value)).state,
  ).toBe(state);
});
