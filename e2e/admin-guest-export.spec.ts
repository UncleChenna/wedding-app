import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { signInAdmin } from "./support/admin-session";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("private filtered guest export", () => {
  test.skip(
    process.env.RUN_GUEST_EXPORT !== "1",
    "Requires isolated local Auth and synthetic fixtures",
  );
  test.setTimeout(120_000);
  let database: Sql;
  const invitation = randomUUID(),
    excluded = randomUUID(),
    table = randomUUID(),
    meal = randomUUID();
  const name = `Export review ${randomUUID()}`;
  const token = randomBytes(32).toString("base64url");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    database = postgres(url, { max: 1 });
    await database.begin(async (tx) => {
      await tx`insert into tables(id,number,capacity) select ${table},coalesce(max(number),0)+1,10 from tables`;
      await tx`insert into menu_items(id,name,category_v2,station,is_available) values (${meal},'Sold-out rice','meal','kitchen',false)`;
      await tx`insert into invitations(id,household_name,token,status,side,table_id,notes) values (${invitation},${name},${token},'rsvp_yes','none',${table},'PRIVATE INTERNAL NOTES'),(${excluded},${name + " excluded"},${randomBytes(32).toString("base64url")},'draft',null,null,null)`;
      await tx`insert into rsvps(invitation_id,attending,count_attending) values (${invitation},true,2)`;
      await tx`insert into guests(invitation_id,name,is_primary,meal_choice,dietary_notes,email) values (${invitation},'Ada',true,${meal},'=SUM(1,1)','private@example.test'),(${invitation},'Uchenna',false,'Legacy stew','No nuts',null)`;
    });
  });
  test.afterAll(async () => {
    if (!database) return;
    try {
      await database`delete from invitations where id in (${invitation},${excluded})`;
      await database`delete from menu_items where id=${meal}`;
      await database`delete from tables where id=${table}`;
    } finally {
      await database.end();
    }
  });
  test("download matches all filters, preserves members and excludes private capabilities", async ({
    page,
    request,
  }, info) => {
    const denied = await request.get("/admin/guests/export", { maxRedirects: 0 });
    expect(denied.status()).toBe(307);
    expect(denied.headers().location).toContain("/admin/sign-in");
    const prefix = process.env.GUEST_EXPORT_PREFIX;
    if (!prefix) throw new Error("Use scripts/test-guest-export.ts");
    await signInAdmin(page, request, `${prefix}-${info.project.name}@example.test`);
    if (info.project.name === "mobile") await page.setViewportSize({ width: 375, height: 900 });
    await page.addInitScript(() => {
      const state = window as unknown as { exportCls: number };
      state.exportCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) state.exportCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/admin/guests");
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await page.evaluate(() => (window as unknown as { exportCls: number }).exportCls)).toBe(
      0,
    );
    await page.getByRole("searchbox", { name: "Search guests" }).fill(`${name} Uchenna`);
    await page.getByLabel("Invitation status", { exact: true }).selectOption("rsvp_yes");
    await page.getByLabel("Sent", { exact: true }).selectOption("unsent");
    await page.getByLabel("Side", { exact: true }).selectOption("value:none");
    await page.getByLabel("Table", { exact: true }).selectOption(`value:${table}`);
    await expect(page.locator("[data-invitation-id]")).toHaveCount(1);
    const link = page.getByRole("link", { name: "Download filtered guest list (CSV)" });
    const href = await link.getAttribute("href");
    if (!href) throw new Error("Export link missing");
    const response = await page.request.get(href);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-disposition"]).toBe('attachment; filename="guest-list.csv"');
    const csv = await response.text();
    expect(csv).toContain('"Ada","Yes","Sold-out rice","\'=SUM(1,1)"');
    expect(csv).toContain('"Uchenna","No","Legacy stew","No nuts"');
    expect(csv.split(name)).toHaveLength(3);
    expect(csv).not.toContain("excluded");
    expect(csv).not.toContain(token);
    expect(csv).not.toMatch(/PRIVATE INTERNAL NOTES|private@example.test/);
    const downloaded = page.waitForEvent("download");
    await link.focus();
    await expect(link).toBeFocused();
    await link.press("Enter");
    const file = await downloaded;
    expect(file.suggestedFilename()).toBe("guest-list.csv");
    const path = await file.path();
    if (!path) throw new Error("Download missing");
    // Response.text removes the UTF-8 BOM; the physical file retains it for Excel.
    expect(readFileSync(path, "utf8").replace(/^\uFEFF/, "")).toBe(csv.replace(/^\uFEFF/, ""));
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of themes) {
      await applyTheme(page, theme);
      await page.evaluate(() => document.fonts.ready);
      expect(await scanA11y(page)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const bounds = await link.boundingBox();
      expect(bounds && bounds.width >= 44 && bounds.height >= 44).toBe(true);
      const directory = `docs/reviews/TICKET-092/${info.project.name}`;
      mkdirSync(directory, { recursive: true });
      await page.screenshot({ path: `${directory}/${theme.id}.png`, fullPage: true });
    }
    await page.getByRole("searchbox", { name: "Search guests" }).fill(`${name} nobody`);
    await expect(page.locator("[data-invitation-id]")).toHaveCount(0);
    const emptyHref = await link.getAttribute("href");
    if (!emptyHref) throw new Error("Export link missing");
    const empty = await page.request.get(emptyHref);
    expect(empty.status()).toBe(200);
    expect((await empty.text()).split("\r\n")).toHaveLength(2);
    expect((await page.request.get("/admin/guests/export?sent=invalid")).status()).toBe(400);
    const emptyHousehold = await page.request.get(
      `/admin/guests/export?q=${encodeURIComponent(name + " excluded")}`,
    );
    expect(await emptyHousehold.text()).toContain('"draft","","Pending",""');
    await database`insert into rsvps(invitation_id,attending,count_attending) values (${excluded},false,0)`;
    await database`update invitations set status='rsvp_no' where id=${excluded}`;
    const declined = await page.request.get(
      `/admin/guests/export?q=${encodeURIComponent(name + " excluded")}`,
    );
    expect(await declined.text()).toContain('"rsvp_no","","No","0"');
  });
});
