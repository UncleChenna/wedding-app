import { expect, it } from "vitest";
import { joinGuestPhone, splitGuestPhone } from "../lib/guest-phone";
import { normalisePhone } from "@/modules/invitations/lib/phone";
it("defaults to Nigeria and saves a local Nigerian number internationally", () => {
  expect(splitGuestPhone("").country).toBe("NG");
  expect(joinGuestPhone("NG", "09160665114")).toBe("+2349160665114");
  expect(normalisePhone(joinGuestPhone("NG", "09160665114"))).toEqual({
    ok: true,
    phone: "+2349160665114",
  });
});
it("keeps optional phones empty and preserves existing country codes", () => {
  expect(joinGuestPhone("NG", "")).toBe("");
  expect(splitGuestPhone("+447700900123")).toEqual({ country: "GB", number: "7700900123" });
  expect(joinGuestPhone("GB", "07700900123")).toBe("+447700900123");
  expect(joinGuestPhone("IT", "0612345678")).toBe("+390612345678");
});
it("accepts pasted international numbers and unlisted countries", () => {
  expect(splitGuestPhone("002349160665114")).toEqual({ country: "NG", number: "9160665114" });
  expect(joinGuestPhone("NG", "+447700900123")).toBe("+447700900123");
  expect(splitGuestPhone("+819012345678")).toEqual({ country: "OTHER", number: "+819012345678" });
  expect(joinGuestPhone("OTHER", "+819012345678")).toBe("+819012345678");
});
