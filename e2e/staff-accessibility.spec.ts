import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type Page } from "@playwright/test";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.use({ trace: "off", screenshot: "off", video: "off" });
const venue = `staff-audit-${randomUUID()}`;
const staffIds: string[] = [];
const tableId = randomUUID(),
  menuId = randomUUID(),
  orderId = randomUUID();
let db: Sql;
const results: unknown[] = [];
async function audit(page: Page, name: string, staff = false) {
  const folder = "docs/reviews/TICKET-118";
  mkdirSync(folder, { recursive: true });
  for (const theme of themes) {
    await applyTheme(page, theme);
    await page.evaluate(() => document.fonts.ready);
    const violations = await scanA11y(page);
    const geometry = await page.evaluate(() => {
      const small: { text: string; px: number }[] = [];
      const root = document.querySelector("main");
      if (!root) throw new Error("Audit requires the rendered main landmark");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode,
          element = node.parentElement;
        if (
          !element ||
          !node.textContent?.trim() ||
          element.closest('[aria-hidden="true"],.sr-only,script,style')
        )
          continue;
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height || getComputedStyle(element).visibility === "hidden")
          continue;
        const px = parseFloat(getComputedStyle(element).fontSize);
        if (px < 18) small.push({ text: node.textContent.trim().slice(0, 80), px });
      }
      return { overflow: document.documentElement.scrollWidth > innerWidth, small };
    });
    results.push({ name, theme: theme.id, violations, ...geometry });
    writeFileSync(`${folder}/results.json`, JSON.stringify(results, null, 2) + "\n");
    writeFileSync(
      `${folder}/${name}-${theme.id}.json`,
      JSON.stringify({ name, theme: theme.id, violations, ...geometry }, null, 2) + "\n",
    );
    if (theme === themes[0])
      await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true });
    expect.soft(violations, `${name}/${theme.id}`).toEqual([]);
    expect.soft(geometry.overflow, `${name}/${theme.id} overflow`).toBe(false);
    if (staff) expect.soft(geometry.small, `${name}/${theme.id} staff typography`).toEqual([]);
  }
}

test.describe("staff/admin accessibility", () => {
  test.skip(process.env.RUN_STAFF_ACCESSIBILITY !== "1", "Requires isolated Auth and database");
  test.setTimeout(240_000);
  test.beforeAll(async () => {
    assertAdminJourneyTarget(process.cwd(), process.env);
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    if ((await db`select id from event_settings where id=1`).length)
      throw new Error("Audit requires empty isolated event settings");
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into tables(id,number,name,capacity) values(${tableId},${randomInt(100000, 900000)},'Audit table',8)`;
    await db`insert into menu_items(id,name,category_v2,station) values(${menuId},'Synthetic rice','meal','kitchen')`;
    await db`insert into orders(id,table_id,notes) values(${orderId},${tableId},'No pepper')`;
    const [station] = await db<
      { id: string }[]
    >`insert into station_orders(order_id,station) values(${orderId},'kitchen') returning id`;
    if (!station) throw new Error("Missing station fixture");
    await db`insert into order_items(order_id,station_order_id,menu_item_id,quantity) values(${orderId},${station.id},${menuId},2)`;
  });
  test.afterAll(async () => {
    if (!db) return;
    for (const id of staffIds) {
      await db`update staff set revoked_at=now() where id=${id}`;
      await db`update registered_devices set revoked_at=coalesce(revoked_at,now()) where registered_by_staff_id=${id}`;
    }
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  });
  test("authenticated staff screens retain readable controls and keyboard actions", async ({
    browser,
    baseURL,
  }) => {
    for (const role of ["gate", "kitchen", "bar"] as const) {
      const id = randomUUID(),
        pin = role === "gate" ? "234561" : role === "kitchen" ? "234562" : "234563";
      staffIds.push(id);
      const salt = randomBytes(32);
      const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
      await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${id},'Synthetic audit operator',${role},${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 375, height: 900 },
        reducedMotion: "reduce",
      });
      try {
        const page = await context.newPage();
        await page.goto(role === "gate" ? "/checkin" : `/${role}`);
        await audit(page, `${role}-sign-in`, true);
        await page.getByLabel("Your six-digit PIN").fill(pin);
        await page.getByRole("button", { name: "Sign in", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
        if (role === "gate")
          await expect(
            page.getByRole("button", { name: "Open camera", exact: true }),
          ).toBeVisible();
        await audit(page, role, true);
      } finally {
        await context.close();
      }
    }
  });
  test("admin routes expose labelled keyboard-operable controls in every theme", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signInAdmin(page, request, process.env.ADMIN_TEST_EMAIL ?? "");
    for (const route of [
      "/admin",
      "/admin/guests",
      "/admin/guests/new",
      "/admin/menu",
      "/admin/staff",
      "/admin/scans",
      "/admin/settings",
      "/admin/themes",
      "/admin/health",
    ]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await audit(page, route.slice(1).replaceAll("/", "-"));
    }
    await page.goto("/admin");
    const staffLink = page.getByRole("link", { name: "Staff", exact: true });
    let reached = false;
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      if (await staffLink.evaluate((element) => element === document.activeElement)) {
        reached = true;
        break;
      }
    }
    expect(reached).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/admin\/staff$/);
  });
});
