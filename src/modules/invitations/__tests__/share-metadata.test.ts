import { describe, expect, it } from "vitest";
import { invitationPreviewHtml, invitationPreviewMetadata } from "../lib/share-metadata";

describe("public invitation previews", () => {
  it("returns only plain data, so cached page metadata stays serializable", () => {
    const result = invitationPreviewMetadata("https://wedding.example");
    expect(structuredClone(result)).toEqual(result);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

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

it("uses saved public event details for both social cards without serializing extra fields", () => {
  const saved = {
    coupleNames: ["Nneka", "Chidi"] as const,
    eventDate: "2027-01-02",
    guestName: "Private Guest",
    token: "private-token",
  };
  const result = invitationPreviewMetadata("https://wedding.example/i/private-token", saved);
  for (const card of [result.openGraph, result.twitter]) {
    expect(card).toMatchObject({
      title: "Nneka & Chidi · 2 January 2027",
      description: "Two stories. One ending: forever.",
    });
  }
  expect(result.openGraph).toMatchObject({
    images: [
      {
        alt: "Nneka and Chidi's wedding invitation.",
      },
    ],
  });
  expect(JSON.stringify(result)).not.toMatch(/Uchenna|Adaora|Private Guest|private-token/);
});

it("escapes saved public details in native preview tags and discards private URL paths", () => {
  const html = invitationPreviewHtml("https://wedding.example/i/private-token?guest=Private", {
    coupleNames: ['Nneka <"', "Chidi & Co"],
    eventDate: "2027-01-02",
  });
  expect(html).toContain('content="Nneka &lt;&quot; &amp; Chidi &amp; Co · 2 January 2027"');
  expect(html).toContain(
    'property="og:image" content="https://wedding.example/invitation-preview"',
  );
  expect(html).toContain('name="twitter:card" content="summary_large_image"');
  expect(html).not.toMatch(/private-token|guest=|<"/);
});
