import { randomInt, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { setOrderingOpen } from "./support/ordering-open";
import { boundedDiagnostic } from "./support/bounded-diagnostic";
import { wireProxy } from "./support/wire-proxy";

const table = randomInt(1_000_000, 2_000_000);
const menuId = randomUUID();
const menuName = `Ọgbọnọ · Crème brûlée ${menuId.slice(0, 8)}`;
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
  for (const colorScheme of ["light", "dark"] as const)
    for (const menu of [false, true]) {
      test(`${colorScheme} ${menu ? "confirmed menu" : "table form"} transfers at most 200 KB including worker install`, async ({
        browser,
        baseURL,
      }, info) => {
        test.setTimeout(60_000);
        if (!baseURL) throw new Error("Production baseURL is required");
        const wire = await wireProxy(baseURL);
        const context = await browser.newContext({
          baseURL: wire.origin,
          serviceWorkers: "allow",
          viewport: info.project.use.viewport ?? { width: 375, height: 812 },
          colorScheme,
        });
        const rows: {
          path: string;
          worker: boolean;
          bytes: number | null;
          status: number | undefined;
          unavailable?: "timeout" | "rejected";
        }[] = [];
        const measurements: Promise<void>[] = [];
        let lastFinished = Date.now();
        context.on("requestfinished", (request) => {
          lastFinished = Date.now();
          measurements.push(
            (async () => {
              const identity = {
                path: new URL(request.url()).pathname,
                worker: Boolean(request.serviceWorker()),
              };
              const diagnostic = await boundedDiagnostic(
                (async () => {
                  const response = await request.response();
                  const sizes = await request.sizes();
                  // Cached body size can be -headers; the sum correctly records zero.
                  return {
                    bytes: sizes.responseBodySize + sizes.responseHeadersSize,
                    status: response?.status(),
                  };
                })(),
                3000,
              );
              rows.push(
                diagnostic.available
                  ? { ...identity, ...diagnostic.value }
                  : { ...identity, bytes: null, status: undefined, unavailable: diagnostic.reason },
              );
            })(),
          );
        });
        try {
          if (menu)
            await context.addCookies([
              { name: "wedding-table", value: String(table), url: wire.origin },
            ]);
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
          await expect
            .poll(() => Date.now() - wire.snapshot().lastReceived, { timeout: 15_000 })
            .toBeGreaterThanOrEqual(1500);
          await expect.poll(() => wire.snapshot().pendingBytes).toBe(0);
          await Promise.all(measurements);
          const total = wire.snapshot().bytes;
          const unavailableDiagnostics = rows.filter((row) => row.bytes === null).length;
          const browserReported = rows.reduce((sum, row) => sum + (row.bytes ?? 0), 0);
          mkdirSync("docs/reviews/TICKET-081", { recursive: true });
          writeFileSync(
            `docs/reviews/TICKET-081/native-wire-${info.project.name}-${colorScheme}-${menu ? "menu" : "table"}.json`,
            JSON.stringify(
              {
                menu,
                colorScheme,
                viewport: info.project.use.viewport,
                budget: 200_000,
                total,
                browserReported,
                unavailableDiagnostics,
                browserReportedComplete: unavailableDiagnostics === 0,
                transport: "loopback HTTP/1 wire; no rewriting",
                rows,
              },
              null,
              2,
            ) + "\n",
          );
          await info.attach("cold-transfer.json", {
            body: JSON.stringify(
              {
                menu,
                colorScheme,
                viewport: info.project.use.viewport,
                budget: 200_000,
                total,
                browserReported,
                unavailableDiagnostics,
                browserReportedComplete: unavailableDiagnostics === 0,
                transport: "loopback HTTP/1 wire; no rewriting",
                rows,
              },
              null,
              2,
            ),
            contentType: "application/json",
          });
          expect(rows.some((row) => row.worker)).toBe(true);
          expect(
            rows.every((row) => (row.bytes === null ? Boolean(row.unavailable) : row.bytes >= 0)),
          ).toBe(true);
          expect(total).toBeGreaterThanOrEqual(browserReported);
          expect(total).toBeLessThanOrEqual(200_000);
        } finally {
          // Release proxy sockets even if Chromium context cleanup fails.
          try {
            await context.close();
          } finally {
            await wire.close();
          }
        }
      });
    }
});
