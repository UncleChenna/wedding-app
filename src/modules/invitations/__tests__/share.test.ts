import { describe, expect, it } from "vitest";

import { buildShareLinks } from "../lib/share";

const input = {
  url: "https://example.com/i/secret-token",
  subject: "Uchenna & Adaora 💛",
  message: "Please join us!\nDinner & dancing? 💛",
  phone: "07700 900123",
  email: "guest+family@example.com",
};

describe("buildShareLinks", () => {
  it("encodes WhatsApp text and normalises the recipient", () => {
    const result = buildShareLinks(input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const whatsapp = new URL(result.links.whatsapp);
    expect(whatsapp.origin).toBe("https://wa.me");
    expect(whatsapp.pathname).toBe("/447700900123");
    expect(whatsapp.searchParams.get("text")).toBe(input.message + "\n\n" + input.url);
    expect(result.links.text).toBe(input.message + "\n\n" + input.url);
  });

  it("encodes mail recipient, subject and body separately", () => {
    const result = buildShareLinks(input);
    if (!result.ok) throw new Error("Valid fixture rejected");
    const mail = new URL(result.links.email);
    expect(decodeURIComponent(mail.pathname)).toBe(input.email);
    expect(mail.searchParams.get("subject")).toBe(input.subject);
    expect(mail.searchParams.get("body")).toBe(input.message + "\n\n" + input.url);
  });

  it("allows the sender to pick recipients when contact details are absent", () => {
    const result = buildShareLinks({ ...input, phone: "", email: undefined });
    if (!result.ok) throw new Error("Valid fixture rejected");
    expect(new URL(result.links.whatsapp).pathname).toBe("/");
    expect(new URL(result.links.email).pathname).toBe("");
  });

  it.each([
    { phone: "not a number" },
    { email: "guest@example.com?bcc=other@example.com" },
    { email: "guest@example.com\r\nBcc: other@example.com" },
    { url: "javascript:alert(1)" },
    { url: "https://user:password@example.com/i/token" },
    { url: "/i/token" },
    { subject: "" },
    { message: "" },
  ])("rejects unsafe or unusable input %j", (change) => {
    expect(buildShareLinks({ ...input, ...change }).ok).toBe(false);
  });

  it.each([null, undefined, 123, "url", {}])("returns an error for runtime input %j", (value) => {
    expect(buildShareLinks(value).ok).toBe(false);
  });

  it("handles malformed Unicode without throwing", () => {
    const result = buildShareLinks({ ...input, message: "\ud800" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(new URL(result.links.whatsapp).searchParams.get("text")).toContain("�");
  });
});
