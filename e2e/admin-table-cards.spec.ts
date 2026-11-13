import { randomInt } from "node:crypto";
import { mkdir } from "node:fs/promises";
import jsQR from "jsqr";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { adminTestEmail, signInAdmin } from "./support/admin-session";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { themes } from "../src/modules/theming/themes";

/** Printable table cards (TICKET-094) on the real admin route, against this worktree's stack. */
test.describe("printable table cards", () => {
  test.skip(
    process.env.RUN_ADMIN_TABLE_CARDS_TESTS !== "1",
    "Requires isolated local Auth/database and fresh allowlisted address",
  );
  test.setTimeout(180_000);
  let db: Sql;
  let previousWifi: { wifi_name: string | null; wifi_password: string | null } | undefined;
  const base = 9000 + randomInt(0, 900) * 3;
  const numbers = [base + 2, base, base + 1];
  const wifi = { name: "Venue Guest", password: "garden party 26" };

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    for (const number of numbers)
      await db`insert into tables(number,name,capacity) values(${number},${number === base ? "Family" : null},8)`;
    [previousWifi] = await db<
      { wifi_name: string | null; wifi_password: string | null }[]
    >`select wifi_name, wifi_password from event_settings where id = 1`;
    await db`insert into event_settings(id,wifi_name,wifi_password) values(1,${wifi.name},${wifi.password})
      on conflict (id) do update set wifi_name = excluded.wifi_name, wifi_password = excluded.wifi_password`;
  });

  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from tables where number in ${db(numbers)}`;
      await db`update event_settings set wifi_name = ${previousWifi?.wifi_name ?? null},
        wifi_password = ${previousWifi?.wifi_password ?? null} where id = 1`;
    } finally {
      await db.end();
    }
  });

  test("one themed card per table whose QR scans to /order, printed one per A6 page", async ({
    page,
    request,
  }, info) => {
    const denied = await request.get("/admin/guests/seating/cards", { maxRedirects: 0 });
    expect([302, 303, 307, 308]).toContain(denied.status());
    expect(await denied.text()).not.toContain(wifi.password);
    await signInAdmin(
      page,
      request,
      adminTestEmail(info.project.name, process.env.ADMIN_TABLE_CARDS_PREFIX ?? "table-cards"),
    );
    await page.goto("/admin/guests/seating");
    await page.getByRole("link", { name: "Print table cards" }).click();
    await expect(page).toHaveURL(/\/admin\/guests\/seating\/cards$/);

    const [total] = await db<{ count: number }[]>`select count(*)::integer as count from tables`;
    const cards = page.locator(".table-card");
    await expect(cards).toHaveCount(total?.count ?? -1);
    for (const number of numbers)
      await expect(page.getByRole("heading", { name: `Table ${number}` })).toBeVisible();
    const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
    const printed = headings.map((text) => Number(text.replace(/\D/g, "")));
    expect(printed).toEqual([...printed].sort((a, b) => a - b));
    await expect(cards.filter({ hasText: wifi.password })).toHaveCount(total?.count ?? -1);

    // Decode the pixels the browser painted for one of our cards, as a phone camera would.
    const qr = page.getByRole("img", { name: `Scan to order food and drinks at table ${base}` });
    const png = (await qr.screenshot()).toString("base64");
    const image = await page.evaluate(async (data) => {
      const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
      context.drawImage(bitmap, 0, 0);
      const {
        data: pixels,
        width,
        height,
      } = context.getImageData(0, 0, bitmap.width, bitmap.height);
      return { pixels: Array.from(pixels), width, height };
    }, png);
    const decoded = jsQR(Uint8ClampedArray.from(image.pixels), image.width, image.height, {
      inversionAttempts: "dontInvert",
    });
    expect(decoded?.data).toBe(new URL("/order", process.env.NEXT_PUBLIC_SITE_URL).toString());

    const dir = `docs/reviews/TICKET-094/${info.project.name}`;
    await mkdir(dir, { recursive: true });
    await page.setViewportSize({ width: 375, height: 812 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `${dir}/${theme.id}-375.png`, fullPage: true });
    }
    for (const width of [600, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }

    await page.evaluate(() => {
      window.print = () => {
        document.body.dataset.printRequested = "yes";
      };
    });
    const printButton = page.getByRole("button", { name: "Print or save PDF" });
    await printButton.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("body")).toHaveAttribute("data-print-requested", "yes");

    await page.emulateMedia({ media: "print" });
    await expect(page.getByRole("navigation", { name: "Admin" })).not.toBeVisible();
    await expect(printButton).not.toBeVisible();
    const pdf = await page.pdf({
      path: `${dir}/table-cards.pdf`,
      preferCSSPageSize: true,
      printBackground: true,
    });
    const pages = pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? [];
    expect(pages).toHaveLength(total?.count ?? -1);
    // A6 portrait is 105 × 148 mm: 297.6 × 419.5 points.
    expect(pdf.toString("latin1")).toMatch(
      /\/MediaBox\s*\[\s*0 0 29[78](\.\d+)? 41[89](\.\d+)?\s*\]/,
    );
  });
});
