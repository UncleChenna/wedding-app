import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageResponse } from "next/og";
import { getTheme } from "@/modules/theming";
import { renderInvitationPreview } from "../server/preview-image";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn(async () => Buffer.from("fixture")) }));
vi.mock("next/og", () => ({ ImageResponse: vi.fn(class {}) }));

it("renders saved public names and date into the image artwork", async () => {
  await renderInvitationPreview(getTheme("ivory-gold"), {
    coupleNames: ["Nneka", "Chidi"],
    eventDate: "2027-01-02",
  });
  const call = vi.mocked(ImageResponse).mock.calls[0];
  if (!call) throw new Error("Image renderer was not called");
  const html = renderToStaticMarkup(call[0]);
  expect(html).toContain("Nneka");
  expect(html).toContain("Chidi");
  expect(html).toContain("2 January 2027");
  expect(html).not.toMatch(/Uchenna|Adaora|19 December 2026/);
  expect(call[1]).toMatchObject({ width: 1200, height: 630 });
});
