import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type BrowserContext } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { signInAdmin } from "./support/admin-session";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

test.describe("event closure rehearsal", () => {
  test.skip(
    process.env.RUN_EVENT_CLOSURE_JOURNEY !== "1",
    "Run scripts/test-event-closure.ts against the isolated stack",
  );
  test.setTimeout(300_000);
  let db: Sql;
  let saved: Record<string, unknown> | undefined;
  let prepared = false;
  const members = [
    { id: randomUUID(), role: "gate", route: "/checkin", pin: "123456" },
    { id: randomUUID(), role: "kitchen", route: "/kitchen", pin: "234567" },
    { id: randomUUID(), role: "bar", route: "/bar", pin: "345678" },
  ];
  const contexts: BrowserContext[] = [];
  const deviceIds: string[] = [];

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    // Closure affects every staff/device record: refuse any pre-existing identities.
    const [counts] =
      await db`select (select count(*) from staff)::int as staff, (select count(*) from registered_devices)::int as devices`;
    expect(counts).toEqual({ staff: 0, devices: 0 });
    [saved] = await db`select * from event_settings where id=1`;
    prepared = true;
    await db`insert into event_settings(id,event_date,time_zone,ordering_open) values(1,'2099-12-19','Etc/UTC',true)
      on conflict(id) do update set event_date='2099-12-19',time_zone='Etc/UTC',ordering_open=true`;
    for (const member of members)
      await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at)
        values(${member.id},'Synthetic closure staff',${member.role},${credential(member.pin)},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
  });

  test.afterAll(async () => {
    for (const context of contexts) await context.close();
    if (!db) return;
    try {
      if (prepared) {
        await db`delete from registered_devices where registered_by_staff_id in ${db(members.map((member) => member.id))}`;
        for (const id of deviceIds) await db`delete from staff_pin_attempts where device_id=${id}`;
        await db`delete from staff where id in ${db(members.map((member) => member.id))}`;
        if (saved) {
          const { id: _id, ...columns } = saved;
          await db`update event_settings set ${db(columns)} where id=1`;
        } else await db`delete from event_settings where id=1`;
      }
    } finally {
      await db.end();
    }
  });

  test("admin closes safely and every existing staff session loses access", async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    for (const member of members) {
      const context = await browser.newContext({ baseURL });
      contexts.push(context);
      const staffPage = await context.newPage();
      await staffPage.goto(member.route);
      await staffPage.getByLabel("Your six-digit PIN").fill(member.pin);
      await staffPage.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(staffPage.getByText("You’re signed in.", { exact: true })).toBeVisible();
      const device = (await context.cookies())
        .find((cookie) => cookie.name === "wedding-staff-device")
        ?.value.split(".")[0];
      if (!device) throw new Error("Synthetic staff device missing");
      deviceIds.push(device);
      const denied = await context.request.get("/admin/memories/csv", { maxRedirects: 0 });
      expect(denied.status()).toBe(307);
      expect(denied.headers().location).toContain("/admin/sign-in");
    }
    await signInAdmin(page, request, process.env.ADMIN_TEST_EMAIL ?? "");
    await page.goto("/admin/event-closure");
    await expect(page.getByRole("heading", { name: "After the celebration" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Close the event", exact: true })).toBeDisabled();
    for (const format of ["csv", "pdf"]) {
      const response = await page.request.get(`/admin/memories/${format}`);
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers()["content-disposition"]).toContain("attachment");
      if (format === "pdf") expect((await response.body()).subarray(0, 5).toString()).toBe("%PDF-");
      else expect(await response.text()).not.toContain("Synthetic closure staff");
    }
    await db`update event_settings set event_date='2000-01-01' where id=1`;
    await page.reload();
    mkdirSync("artifacts/TICKET-166/screenshots", { recursive: true });
    for (const theme of themes) {
      await applyTheme(page, theme);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await expect(
          page.getByRole("button", { name: "Close the event", exact: true }),
        ).toBeEnabled();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(await scanA11y(page)).toEqual([]);
        await page.screenshot({
          path: `artifacts/TICKET-166/screenshots/${theme.id}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await page.getByLabel("All scanners have synced", { exact: false }).check();
    await page.getByLabel("Type CLOSE EVENT to confirm").fill("CLOSE EVENT");
    await page.getByRole("button", { name: "Close the event", exact: true }).click();
    await expect(page.getByRole("form", { name: "Close event" }).getByRole("status")).toContainText(
      "The event is closed",
    );
    const [closed] = await db`select ordering_open from event_settings where id=1`;
    expect(closed?.ordering_open).toBe(false);
    const revoked = await db`select pin_hash,revoked_at from staff`;
    expect(revoked).toHaveLength(3);
    for (const member of revoked) {
      expect(member.pin_hash).toBeNull();
      expect(member.revoked_at).toBeInstanceOf(Date);
    }
    // Restore a future date only inside this synthetic rehearsal to prove rejection
    // comes from live revocation, not merely the now-expired event cutoff.
    await db`update event_settings set event_date='2099-12-19' where id=1`;
    for (let index = 0; index < members.length; index++) {
      const context = contexts[index];
      const member = members[index];
      if (!context || !member) throw new Error("Missing synthetic staff context");
      const staffPage = context.pages()[0];
      if (!staffPage) throw new Error("Missing staff page");
      await staffPage.goto(member.route);
      await expect(staffPage.getByLabel("Your six-digit PIN")).toBeVisible();
      await expect(staffPage.getByText("You’re signed in.", { exact: true })).toHaveCount(0);
    }
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });
});
