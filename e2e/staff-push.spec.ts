import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import postgres, { type Sql } from "postgres";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { localBudgetIdentity } from "./support/local-budget-identity";

test.describe("staff notification controls and worker delivery", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(process.env.RUN_STAFF_PUSH_JOURNEY !== "1", "Use the isolated staff-push runner");
  let db: Sql;
  let restoreSettings: (() => Promise<unknown>) | undefined;
  const id = randomUUID();
  const pin = String(randomInt(100000, 999999));
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const [previous] = await db<
      { event_date: string; time_zone: string | null }[]
    >`select event_date::text,time_zone from event_settings where id=1`;
    await db`insert into event_settings(id,event_date,time_zone) values(1,'2099-12-19','UTC') on conflict(id) do update set event_date='2099-12-19',time_zone='UTC'`;
    restoreSettings = () =>
      previous
        ? db`update event_settings set event_date=${previous.event_date},time_zone=${previous.time_zone} where id=1`
        : db`delete from event_settings where id=1`;
    const salt = randomBytes(32);
    const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    const credential = `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${id},'Synthetic push operator','kitchen',${credential},now()-interval '1 minute','2099-12-20')`;
    await db`delete from request_budgets where scope='pin' and identity=${localBudgetIdentity()}`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from staff_pin_attempts where device_id in(select id from registered_devices where registered_by_staff_id=${id})`;
      await db`delete from registered_devices where registered_by_staff_id=${id}`;
      await db`delete from staff where id=${id}`;
      await restoreSettings?.();
    } finally {
      await db.end();
    }
  });

  test("permission denial leaves the authenticated board usable in every theme", async ({
    page,
    context,
    baseURL,
  }, info) => {
    test.setTimeout(90_000);
    await context.grantPermissions([], { origin: baseURL });
    await page.goto("/kitchen");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No orders waiting" })).toBeVisible();
    const button = page.getByRole("button", { name: "Notify me of new orders" });
    await expect(button).toBeVisible();
    await expect.poll(() => page.evaluate(() => Notification.permission)).toBe("denied");
    await button.click();
    await expect(
      page.getByRole("status").filter({ hasText: "Notifications are off" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Turn on sound" })).toBeEnabled();
    const captures = join(
      process.env.STAFF_PUSH_REVIEW_DIR ?? "artifacts/TICKET-112",
      info.project.name,
    );
    mkdirSync(captures, { recursive: true });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        const target = await button.boundingBox();
        expect(target?.height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({ path: join(captures, `${theme.id}-${width}.png`), fullPage: true });
      }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await button.focus();
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(button).toBeEnabled();
  });

  test("an actual worker displays a generic push and retains fixed station identity", async ({
    page,
    context,
    baseURL,
  }) => {
    // DevTools supplies the transport payload. This verifies the real worker and
    // Notification API, not external FCM/APNs registration or provider encryption.
    if (!baseURL) throw new Error("Missing local browser base URL");
    await context.grantPermissions(["notifications"], { origin: baseURL });
    const cdp = await context.newCDPSession(page);
    let registrationId: string | undefined;
    cdp.on(
      "ServiceWorker.workerRegistrationUpdated",
      (event: { registrations: { scopeURL: string; registrationId: string }[] }) => {
        registrationId =
          event.registrations.find((registration) => registration.scopeURL === `${baseURL}/`)
            ?.registrationId ?? registrationId;
      },
    );
    await cdp.send("ServiceWorker.enable");
    await page.goto("/offline");
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
    });
    await expect.poll(() => registrationId).toBeTruthy();
    if (!registrationId) throw new Error("Worker registration was not observed");
    await cdp.send("ServiceWorker.deliverPushMessage", {
      origin: baseURL,
      registrationId,
      data: JSON.stringify({
        type: "station-order",
        station: "kitchen",
        body: "private detail must not display",
        url: "https://invalid.example",
      }),
    });
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const notices = await (await navigator.serviceWorker.ready).getNotifications();
          return notices.map(({ title, body, data }) => ({ title, body, data }));
        }),
      )
      .toEqual([
        {
          title: "New kitchen orders",
          body: "Open the board to see the latest orders.",
          data: { station: "kitchen" },
        },
      ]);
    await page.evaluate(async () => {
      for (const notice of await (await navigator.serviceWorker.ready).getNotifications())
        notice.close();
    });
    await cdp.detach();
  });
});
