import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";

const table = randomInt(1_000_000, 2_000_000);
const menuId = randomUUID();
const menuName = `Performance fixture ${menuId.slice(0, 8)}`;
let db: Sql;
let restoreOrdering: (() => Promise<void>) | undefined;

// A fresh context retains normal HTTP caching within the visit and enables the
// worker. Include worker installation traffic rather than hiding it with mocks.
test.describe("order first-visit transfer budget", () => {
  test.skip(process.env.RUN_ORDER_PERFORMANCE !== "1", "Needs an isolated migrated database");
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, onnotice: () => {} });
    restoreOrdering = await setOrderingOpen(db, true);
    await db`insert into tables(number, name, capacity) values (${table}, 'Synthetic performance table', 8)`;
    await db`insert into menu_items(id, name, category_v2, station, max_per_order, is_available)
      values (${menuId}, ${menuName}, 'meal', 'kitchen', 5, true)`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from menu_items where id = ${menuId}`;
      await db`delete from tables where number = ${table}`;
    } finally {
      await restoreOrdering?.();
      await db.end();
    }
  });
  for (const menu of [false, true]) {
    test(`${menu ? "confirmed menu" : "table form"} transfers at most 200 KB including worker install`, async ({
      browser,
      baseURL,
    }, info) => {
      test.setTimeout(60_000);
      if (!baseURL) throw new Error("Production baseURL is required");
      const context = await browser.newContext({
        baseURL,
        serviceWorkers: "allow",
        viewport: { width: 375, height: 812 },
      });
      const rows: { path: string; worker: boolean; bytes: number; status: number | undefined }[] =
        [];
      const measurements: Promise<void>[] = [];
      let lastFinished = Date.now();
      context.on("requestfinished", (request) => {
        lastFinished = Date.now();
        measurements.push(
          (async () => {
            const response = await request.response();
            const sizes = await request.sizes();
            // Chromium reports cached body size as -headers; their sum correctly
            // records zero network transfer. Never clamp the components separately.
            rows.push({
              path: new URL(request.url()).pathname,
              worker: Boolean(request.serviceWorker()),
              bytes: sizes.responseBodySize + sizes.responseHeadersSize,
              status: response?.status(),
            });
          })(),
        );
      });
      try {
        if (menu)
          await context.addCookies([{ name: "wedding-table", value: String(table), url: baseURL }]);
        const page = await context.newPage();
        const response = await page.goto("/order");
        expect(response?.status()).toBe(200);
        await expect(
          page.getByRole("heading", { name: "Hungry? Thirsty? Say the word." }),
        ).toBeVisible();
        if (menu)
          await expect(
            page.getByRole("button", { name: `Increase ${menuName} quantity` }),
          ).toBeVisible();
        else await expect(page.getByLabel("Table number", { exact: true })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() =>
          Promise.race([
            navigator.serviceWorker.ready.then(() => undefined),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("Worker installation did not finish")), 30_000),
            ),
          ]),
        );
        await expect
          .poll(() => Date.now() - lastFinished, { timeout: 15_000 })
          .toBeGreaterThanOrEqual(1500);
        await Promise.all(measurements);
        const total = rows.reduce((sum, row) => sum + row.bytes, 0);
        await info.attach("cold-transfer.json", {
          body: JSON.stringify({ menu, budget: 200_000, total, rows }, null, 2),
          contentType: "application/json",
        });
        expect(rows.some((row) => row.worker)).toBe(true);
        expect(rows.every((row) => row.bytes >= 0)).toBe(true);
        expect(total).toBeLessThanOrEqual(200_000);
      } finally {
        await context.close();
      }
    });
  }
});
