// @vitest-environment jsdom
import { expect, it } from "vitest";
import { readGuestCsv } from "../lib/guest-import-view";
function file(bytes: Uint8Array) {
  const value = new File([Uint8Array.from(bytes)], "guests.csv");
  Object.defineProperty(value, "arrayBuffer", { value: async () => Uint8Array.from(bytes).buffer });
  return value;
}
it("reads UTF-8 names and removes the optional BOM", async () => {
  expect(await readGuestCsv(file(new TextEncoder().encode("\ufeffname\r\nAdaọra\r\n")))).toBe(
    "name\r\nAdaọra\r\n",
  );
});
it("refuses invalid UTF-8 rather than silently replacing guest names", async () => {
  await expect(readGuestCsv(file(new Uint8Array([0xc3, 0x28])))).rejects.toThrow();
});
