import { describe, expect, it, vi } from "vitest";
import { formatCardNumber } from "../lib/printed-card";
import { renderPrintedCard } from "../server/printed-card-pdf";
import { printedCardResponse } from "../server/printed-card-response";

const card = {
  cardNumber: 42,
  guestName: "Ada’s household",
  capacity: 3,
  status: "sent",
  rsvpUrl: "https://example.com/i/" + "a".repeat(43) + "#reply",
};
describe("personalised original card", () => {
  it("pads permanent numbers without truncating larger numbers", () => {
    expect(formatCardNumber(3)).toBe("003");
    expect(formatCardNumber(12345)).toBe("12345");
    for (const value of [0, -1, 1.2, NaN]) expect(() => formatCardNumber(value)).toThrow();
  });
  it("renders three pages with the personal RSVP link and original images", async () => {
    const pdf = await renderPrintedCard(card);
    const text = pdf.toString("latin1");
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text.match(/\/Type \/Page\b/g)).toHaveLength(3);
    expect(text).toContain(card.rsvpUrl);
    expect(text).toContain("/Subtype /Image");
    expect(text).toContain("/FontFile2");
  });
  it.each([
    "javascript:alert(1)",
    "https://example.com/p/admission",
    "https://user:pass@example.com/i/" + "a".repeat(43),
  ])("refuses unsafe RSVP destinations", async (rsvpUrl) => {
    await expect(renderPrintedCard({ ...card, rsvpUrl })).rejects.toThrow(
      "Invalid invitation destination",
    );
  });
  it("downloads privately before RSVP, without issuing an entry pass", async () => {
    const response = await printedCardResponse(async () => card);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("content-disposition")).toContain("invitation-card-42.pdf");
  });
  it("returns absent or unavailable without leaking loader errors", async () => {
    expect((await printedCardResponse(async () => null)).status).toBe(404);
    const response = await printedCardResponse(
      vi.fn().mockRejectedValue(new Error("secret token")),
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("secret");
  });
});
