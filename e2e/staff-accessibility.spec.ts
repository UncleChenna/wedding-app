import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";
import { auditStaffScreen as audit } from "./support/staff-audit";

test.use({ trace: "off", screenshot: "off", video: "off" });
const venue = `staff-audit-${randomUUID()}`;
const staffIds: string[] = [];
const tableId = randomUUID(),
  menuId = randomUUID(),
  orderId = randomUUID();
let db: Sql;

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
    const invitation = randomUUID();
    await db`insert into invitations(id,token,status,table_id) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes',${tableId})`;
    await db`insert into guests(invitation_id,name,is_primary,dietary_notes) values(${invitation},'Synthetic dietary guest',true,'No nuts')`;
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
        if (role !== "gate") {
          const trigger = page.getByRole("button", { name: "New order", exact: true });
          await trigger.focus();
          await page.keyboard.press("Enter");
          const dialog = page.getByRole("dialog", { name: "New order for a table" });
          await expect(dialog).toBeVisible();
          await audit(page, `${role}-new-order`, true);
          await page.keyboard.press("Shift+Tab");
          expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(
            true,
          );
          await page.keyboard.press("Escape");
          await expect(dialog).not.toBeVisible();
          await expect(trigger).toBeFocused();
        }
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
      await expect(page.locator("main:visible")).toHaveCount(1);
      await audit(page, route.slice(1).replaceAll("/", "-"));
    }
    await page.goto("/admin/settings");
    for (const field of await page
      .locator("main:visible input,main:visible select,main:visible textarea,main:visible button")
      .all()) {
      if (!(await field.isVisible()) || !(await field.isEnabled())) continue;
      await field.focus();
      expect(
        await field.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          const hit = document.elementFromPoint(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
          );
          return hit !== null && (hit === element || element.contains(hit));
        }),
        "Settings keyboard focus must not be covered by the fixed navigation",
      ).toBe(true);
    }
    await page.goto("/admin");
    const staffLink = page
      .getByRole("navigation", { name: "Admin", exact: true })
      .getByRole("link", { name: "Staff", exact: true });
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
