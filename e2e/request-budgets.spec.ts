import { createHmac } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { listThemes } from "../src/modules/theming";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

// This suite deliberately fills this isolated app's local network bucket. Run serially,
// alone, with RUN_RATE_LIMIT_BROWSER_TESTS=1; preserve any pre-existing counter exactly.
const identity = createHmac("sha256", "local-shared-request-budget")
  .update("rate-limit:v1:local-shared")
  .digest("hex");
type Counter = { scope: string; used: number; expires_at: Date };
let db: Sql;
let original: Counter[];

test.describe("private request budgets", () => {
  test.skip(
    process.env.RUN_RATE_LIMIT_BROWSER_TESTS !== "1",
    "Requires the isolated local database and serial execution",
  );
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2, prepare: false });
    original = await db<
      Counter[]
    >`select scope, used, expires_at from request_budgets where identity=${identity}`;
  });
  test.afterAll(async () => {
    if (!db || !original) return;
    try {
      await db.begin(async (tx) => {
        await tx`delete from request_budgets where identity=${identity}`;
        for (const row of original) {
          await tx`insert into request_budgets(scope,identity,used,expires_at)
            values(${row.scope},${identity},${row.used},${row.expires_at})`;
        }
      });
    } finally {
      await db.end();
    }
  });

  test("blocks every private read with uniform retry responses despite forged identity headers", async ({
    request,
  }) => {
    await db`insert into request_budgets(scope,identity,used,expires_at)
      values('lookup',${identity},1200,now()+interval '60 seconds')
      on conflict(scope,identity) do update set used=excluded.used,expires_at=excluded.expires_at`;
    for (const path of [
      "/i/unknown",
      "/i/unknown/pass.png",
      "/i/unknown/invitation.pdf",
      "/i/unknown/offline-pass",
      "/p/unknown",
    ]) {
      const response = await request.get(path, {
        headers: {
          "x-forwarded-for": "198.51.100.3",
          "x-vercel-forwarded-for": "192.0.2.7",
          cookie: "wedding-staff-device=forged",
        },
      });
      expect(response.status()).toBe(429);
      expect(Number(response.headers()["retry-after"])).toBeGreaterThan(0);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(await response.text()).toContain("Please wait");
      expect(await response.text()).not.toContain("unknown");
    }
    await db`update request_budgets set expires_at=now()-interval '1 second' where scope='lookup' and identity=${identity}`;
    const recovered = await request.get("/i/unknown");
    expect(recovered.status()).toBe(404);
  });

  test("retains the PIN network lockout after browser cookies are removed", async ({
    page,
    context,
  }) => {
    await db`insert into request_budgets(scope,identity,used,expires_at)
      values('pin',${identity},30,now()+interval '10 minutes')
      on conflict(scope,identity) do update set used=excluded.used,expires_at=excluded.expires_at`;
    for (let attempt = 0; attempt < 2; attempt++) {
      await context.clearCookies();
      await page.goto("/checkin");
      await page.getByLabel("Your six-digit PIN").fill("999999");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(
        page.getByRole("form", { name: "Staff sign-in" }).getByRole("status"),
      ).toContainText("Please wait");
      expect(
        (await context.cookies()).some((cookie) => cookie.name === "wedding-staff-session"),
      ).toBe(false);
    }
    const [counter] =
      await db`select used from request_budgets where scope='pin' and identity=${identity}`;
    expect(counter?.used).toBe(30);
  });

  test("retry states remain readable and operable across all themes and widths", async ({
    page,
  }, info) => {
    test.skip(
      info.project.name !== "desktop",
      "One explicit 375/768/1280 matrix covers the visual states",
    );
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const state of ["guest", "pin"] as const) {
      const scope = state === "guest" ? "lookup" : "pin";
      const used = state === "guest" ? 1200 : 30;
      const windowSeconds = state === "guest" ? 60 : 600;
      await db`insert into request_budgets(scope,identity,used,expires_at)
        values(${scope},${identity},${used},now()+${windowSeconds}*interval '1 second')
        on conflict(scope,identity) do update set used=excluded.used,expires_at=excluded.expires_at`;
      const response = await page.goto(
        state === "guest" ? "/i/synthetic-private-link" : "/checkin",
      );
      if (state === "guest") {
        expect(response?.status()).toBe(429);
        await expect(page.getByRole("heading", { name: "Please try again shortly" })).toBeVisible();
        await expect(page).toHaveURL(/\/i\/synthetic-private-link$/);
      } else {
        await page.getByLabel("Your six-digit PIN").fill("999999");
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await expect(
          page.getByRole("form", { name: "Staff sign-in" }).getByRole("status"),
        ).toContainText("Please wait");
      }
      for (const theme of listThemes()) {
        await applyTheme(page, theme);
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          expect(await scanA11y(page)).toEqual([]);
          const button = page.getByRole("button", {
            name: state === "guest" ? "Try again" : "Sign in",
            exact: true,
          });
          const bounds = await button.boundingBox();
          expect(bounds?.width).toBeGreaterThanOrEqual(44);
          expect(bounds?.height).toBeGreaterThanOrEqual(44);
          await page.screenshot({
            path: `docs/reviews/TICKET-185/screenshots/${theme.id}/${width}/${state}.png`,
            fullPage: true,
          });
        }
      }
      if (state === "guest") {
        await page.keyboard.press("Tab");
        await expect(page.getByRole("button", { name: "Try again" })).toBeFocused();
        await db`update request_budgets set expires_at=now()-interval '1 second' where scope='lookup' and identity=${identity}`;
        await page.keyboard.press("Enter");
        await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
      } else {
        await page.getByLabel("Your six-digit PIN").focus();
        await page.keyboard.press("Tab");
        await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeFocused();
      }
    }
  });
});
