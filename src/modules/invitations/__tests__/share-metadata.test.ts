import { describe, expect, it } from "vitest";
import { invitationPreviewMetadata } from "../lib/share-metadata";

describe("public invitation previews", () => {
  it("uses approved public wording and a token-free image URL", () => {
    const result = invitationPreviewMetadata("https://wedding.example/i/private-token?guest=Amara");
    expect(result.openGraph).toMatchObject({
      title: "Uchenna & Adaora · 19 December 2026",
      description: "Two stories. One ending: forever.",
      images: [{ url: "https://wedding.example/invitation-preview", width: 1200, height: 630 }],
    });
    expect(JSON.stringify(result)).not.toMatch(/private-token|Amara|guest=/);
  });

  it("gives Twitter the same public preview without a personal canonical URL", () => {
    const result = invitationPreviewMetadata("https://wedding.example");
    expect(result.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["https://wedding.example/invitation-preview"],
    });
    expect(result.alternates).toBeUndefined();
    expect(result.openGraph).not.toHaveProperty("url");
  });
});
