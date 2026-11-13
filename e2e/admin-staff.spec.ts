import { randomInt } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { adminTestEmail, signInAdmin } from "./support/admin-session";

test.describe("admin staff PINs", () => {
  test.skip(
    process.env.RUN_ADMIN_STAFF_TESTS !== "1" || !process.env.STAFF_SESSION_SECRET,
    "Requires local Auth, ADMIN_EMAIL_ALLOWLIST with the test address, and STAFF_SESSION_SECRET",
  );
  test.setTimeout(300_000);
  let db: Sql;
  let saved: { event_date: string; time_zone: string | null } | undefined;
  const tag = "TICKET-096 fixture " + randomInt(100000, 900000);

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    [saved] = await db<
      { event_date: string; time_zone: string | null }[]
    >`select event_date::text, time_zone from event_settings where id = 1`;
    // A PIN needs a venue time zone and a wedding still ahead.
    await db`insert into event_settings (id, event_date, time_zone) values (1, '2026-12-19', 'Africa/Lagos')
      on conflict (id) do update set event_date = '2026-12-19', time_zone = 'Africa/Lagos'`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from registered_devices where registered_by_staff_id in (select id from staff where name like ${tag + "%"})`;
      await db`delete from staff where name like ${tag + "%"}`;
      if (saved)
        await db`update event_settings set event_date = ${saved.event_date}, time_zone = ${saved.time_zone} where id = 1`;
    } finally {
      await db.end();
    }
  });

  test("issue a PIN shown once, sign in with it, and removing access signs the device out", async ({
    page,
    request,
    browser,
    baseURL,
  }, info) => {
    await signInAdmin(page, request, adminTestEmail(info.project.name, "staff"));
    await page.goto("/admin/staff");
    await expect(page.getByRole("heading", { name: "Staff", level: 1 })).toBeVisible();

    const name = tag + " Ada";
    const add = page.getByRole("region", { name: "Add a person" });
    await add.getByLabel("Name").fill(name);
    await add.getByRole("button", { name: "Add a person" }).click();
    await expect(
      add.getByText("Choose the gate, the kitchen, the bar or table host."),
    ).toBeVisible();
    await expect(add.getByLabel("Name")).toHaveValue(name);
    await add.getByLabel("Works at").selectOption("kitchen");
    await add.getByRole("button", { name: "Add a person" }).click();
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
    await expect(page.getByText("No PIN yet").first()).toBeVisible();

    await page.getByRole("button", { name: "Issue PIN: " + name }).click();
    const panel = page.getByRole("status", { name: "PIN for " + name });
    await expect(panel).toBeVisible();
    const pin = ((await panel.getByTestId("issued-pin").textContent()) ?? "").trim();
    expect(pin).toMatch(/^\d{6}$/);
    await expect(panel).toContainText("PIN works until Sun 20 Dec, 06:00");
    const [stored] = await db<
      { hash: string }[]
    >`select pin_hash as hash from staff where name = ${name}`;
    expect(stored?.hash).not.toContain(pin);

    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        if (width === 375) expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir = "docs/reviews/TICKET-096/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await panel.scrollIntoViewIfNeeded();
        await page.screenshot({ path: dir + "/" + width + "-pin.png" });
      }

    // Shown once: a fresh load of the page never brings the PIN back.
    await page.reload();
    await expect(page.getByText(pin, { exact: true })).toHaveCount(0);
    await expect(page.getByText("PIN works until Sun 20 Dec, 06:00")).toBeVisible();

    const kitchen = await browser.newContext({ baseURL });
    try {
      const device = await kitchen.newPage();
      await device.goto("/kitchen");
      await device.getByLabel("Your six-digit PIN").fill(pin);
      await device.getByLabel("Your six-digit PIN").press("Enter");
      await expect(device.getByText("You’re signed in.", { exact: true })).toBeVisible();
      await expect(device.getByText("This device is kitchen device.")).toBeVisible();

      // TICKET-064: the device keeps one id across reloads and a fresh sign-in.
      const devicesFor = () =>
        db<
          { id: string; name: string }[]
        >`select d.id, d.name from registered_devices d join staff s on s.id = d.registered_by_staff_id where s.name = ${name}`;
      const [registered] = await devicesFor();
      expect(registered?.id).toMatch(/^[0-9a-f]{64}$/);
      await device.reload({ timeout: 15_000 });
      await device.getByRole("button", { name: "Sign out" }).click({ timeout: 15_000 });
      await expect(device).toHaveURL(/\/staff$/, { timeout: 15_000 });
      await device.goto("/kitchen", { timeout: 15_000 });
      await device.getByLabel("Your six-digit PIN").fill(pin);
      await device.getByLabel("Your six-digit PIN").press("Enter");
      await expect(device.getByText("You’re signed in.", { exact: true })).toBeVisible();
      expect((await devicesFor()).map((row) => row.id)).toEqual([registered?.id]);

      // Renaming shows on the device's next screen.
      const deviceName = "Kitchen tablet " + randomInt(10, 99);
      await page.reload({ timeout: 15_000 });
      const devices = page.getByRole("region", { name: "Devices" });
      const item = devices.getByRole("listitem").filter({ hasText: "First signed in by " + name });
      await item.getByLabel("Device name").fill(deviceName, { timeout: 15_000 });
      await item.getByRole("button", { name: "Rename: kitchen device" }).click();
      await expect(item.getByRole("status")).toHaveText(
        "Renamed. The device shows it on its next screen.",
      );
      await device.reload();
      await expect(device.getByText(`This device is ${deviceName}.`)).toBeVisible();

      for (const theme of themes)
        for (const width of [375, 768, 1280]) {
          const dir = "docs/reviews/TICKET-064/" + theme.id;
          mkdirSync(dir, { recursive: true });
          for (const [view, target] of [
            [page, item],
            [device, device.getByText(`This device is ${deviceName}.`)],
          ] as const) {
            await view.setViewportSize({ width, height: 900 });
            await view.emulateMedia({ reducedMotion: "reduce" });
            await applyTheme(view, theme);
            if (width === 375) expect(await scanA11y(view)).toEqual([]);
            expect(
              await view.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            ).toBe(true);
            await target.scrollIntoViewIfNeeded();
            await view.screenshot({
              path: `${dir}/${width}-${view === page ? "admin-devices" : "device-name"}.png`,
            });
          }
        }

      await page.getByRole("button", { name: "Remove access: " + name }).click();
      await expect(page.getByText("Access removed").first()).toBeVisible();
      const started = Date.now();
      await device.reload();
      await expect(device.getByLabel("Your six-digit PIN")).toBeVisible();
      await expect(device.getByText("You’re signed in.", { exact: true })).toHaveCount(0);
      expect(Date.now() - started).toBeLessThan(60_000);
    } finally {
      await kitchen.close();
    }
  });

  test("TICKET-086: a kitchen person opts in to order alerts with a WhatsApp number", async ({
    page,
    request,
  }, info) => {
    await signInAdmin(page, request, adminTestEmail(info.project.name, "alerts"));
    await page.goto("/admin/staff");
    const name = tag + " Bisi";
    const add = page.getByRole("region", { name: "Add a person" });
    await add.getByLabel("Name").fill(name);
    await add.getByLabel("Works at").selectOption("bar");
    await add.getByRole("button", { name: "Add a person" }).click();
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();

    const save = page.getByRole("button", { name: `Save: ${name}'s alerts` });
    const form = page.locator("form").filter({ has: save });
    // Opting in with no number is refused, and what was ticked survives.
    await form.getByLabel("Send them order alerts").check();
    await save.click();
    await expect(form.getByText("Please check the number.").first()).toBeVisible();
    await expect(form.getByLabel("Send them order alerts")).toBeChecked();

    await form.getByLabel("WhatsApp number").fill("0803 123 4567");
    await save.click();
    await expect(form.getByRole("status")).toHaveText(
      "Saved. They'll get order alerts on WhatsApp.",
    );
    const [stored] = await db<
      { number: string | null; optIn: boolean }[]
    >`select whatsapp_number as number, alerts_opt_in as "optIn" from staff where name = ${name}`;
    expect(stored).toEqual({ number: "+2348031234567", optIn: true });

    await page.setViewportSize({ width: 375, height: 900 });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page), theme.id).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    const dir = "docs/reviews/TICKET-086";
    mkdirSync(dir, { recursive: true });
    const [first] = themes;
    expect(first).toBeDefined();
    if (first) await applyTheme(page, first);
    await form.scrollIntoViewIfNeeded();
    await page.screenshot({ path: dir + "/375-alert-opt-in.png" });
  });
});
