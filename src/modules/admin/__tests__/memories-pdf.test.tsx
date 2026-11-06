import { expect, it, vi } from "vitest";
import { mkdir, writeFile } from "node:fs/promises";
import type * as PdfRenderer from "@react-pdf/renderer";
import { isValidElement, type ReactNode } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getTheme, listThemes } from "@/modules/theming/lib/registry";
import { renderMemoriesPdf } from "../server/memories-pdf";

vi.mock("@react-pdf/renderer", async (importOriginal) => {
  const actual = await importOriginal<typeof PdfRenderer>();
  return { ...actual, renderToBuffer: vi.fn(actual.renderToBuffer) };
});

const aggregate = {
  invitations: 100,
  repliedYes: 60,
  repliedNo: 10,
  attending: 120,
  admissions: 110,
  menu: [{ name: "Jollof rice", ordered: 80, served: 72 }],
};

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

it.each(listThemes())("renders an anonymous A4 memories PDF in $id", async (theme) => {
  const result = await renderMemoriesPdf(
    {
      ...aggregate,
      email: "private@example.test",
      dietaryNotes: "PRIVATE ALLERGY",
      menu: [{ ...aggregate.menu[0], phone: "PRIVATE PHONE" }],
    },
    theme,
  );
  expect(result.subarray(0, 5).toString()).toBe("%PDF-");
  expect(result.toString("latin1")).toContain("/FontFile2");
  expect(result.toString("latin1")).toMatch(/\/MediaBox \[0 0 595\.\d+ 841\.\d+\]/);
  const calls = vi.mocked(renderToBuffer).mock.calls;
  const document = calls.at(-1)?.[0];
  const text = textOf(document).replace(/\s+/g, " ");
  expect(text).toContain("Our celebration in numbers");
  expect(text).toContain("Jollof rice");
  expect(text).toContain("80 ordered");
  expect(text).toContain("72 served");
  for (const secret of ["private@example.test", "PRIVATE ALLERGY", "PRIVATE PHONE"])
    expect(text).not.toContain(secret);
  if (process.env.RUN_MEMORIES_PDF_REVIEW === "1") {
    await mkdir("artifacts/TICKET-166", { recursive: true });
    await writeFile(`artifacts/TICKET-166/${theme.id}.pdf`, result);
  }
});

it("rejects invalid aggregate counts before rendering", async () => {
  const before = vi.mocked(renderToBuffer).mock.calls.length;
  await expect(
    renderMemoriesPdf({ ...aggregate, attending: -1 }, getTheme("ivory-gold")),
  ).rejects.toThrow();
  expect(vi.mocked(renderToBuffer).mock.calls).toHaveLength(before);
});

it("paginates a large menu and preserves the final item", async () => {
  const result = await renderMemoriesPdf(
    {
      ...aggregate,
      menu: Array.from({ length: 90 }, (_, index) => ({
        name: `Celebration meal ${index}`,
        ordered: 3,
        served: 2,
      })),
    },
    getTheme("ivory-gold"),
  );
  expect((result.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
  expect(textOf(vi.mocked(renderToBuffer).mock.calls.at(-1)?.[0])).toContain("Celebration meal 89");
  if (process.env.RUN_MEMORIES_PDF_REVIEW === "1") {
    await mkdir("artifacts/TICKET-166", { recursive: true });
    await writeFile("artifacts/TICKET-166/long-menu.pdf", result);
  }
});
