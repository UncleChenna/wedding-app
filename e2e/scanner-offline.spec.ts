import { existsSync } from "node:fs";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("authenticated offline scanner", () => {
  test.skip(
    process.env.RUN_OFFLINE_SCANNER !== "1",
    "Requires an isolated synthetic staff database",
  );
  test.setTimeout(120_000);
  let db: Sql;
  const staff = randomUUID();
  const venue = "offline-scanner-" + randomUUID();
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    const salt = randomBytes(32);
    const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync("012345", salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic offline gate','gate',${hash},now() - interval '1 minute','2099-12-20T06:00:00Z')`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from registered_devices where registered_by_staff_id=${staff}`;
      await db`delete from staff where id=${staff}`;
      await db`delete from event_settings where id=1 and venue=${venue}`;
    } finally {
      await db.end();
    }
  });
  test("prepares after PIN sign-in, restores offline, then clears access on enhanced sign-out", async ({
    page,
    context,
  }) => {
    await page.goto("/checkin");
    expect((await page.request.get("/checkin/offline-shell")).status()).toBe(401);
    await page.getByLabel("Your six-digit PIN").fill("012345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
    await expect(page.getByText(/Camera ready for an offline reload/)).toBeVisible({
      timeout: 20_000,
    });
    const authorized = await page.request.get("/checkin/offline-shell");
    expect(authorized.status()).toBe(200);
    expect(authorized.headers()["cache-control"]).toContain("no-store");
    const grant = (await authorized.json()) as { html: string; session: string; assets: string[] };
    expect(grant.session).toMatch(/^[a-f0-9]{64}$/);
    expect(grant.html).not.toContain("Synthetic offline gate");
    expect(grant.html).not.toContain("$ACTION");
    expect(grant.assets.length).toBeGreaterThanOrEqual(3);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText(/Offline scanner loaded/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Open camera" })).toBeVisible();
    await context.setOffline(false);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/staff$/);
    expect((await page.request.get("/checkin/offline-shell")).status()).toBe(401);
    await context.setOffline(true);
    await page.goto("/checkin");
    await expect(page.getByRole("button", { name: "Open camera" })).toHaveCount(0);
    await expect(page.getByText(/Offline scanner loaded/)).toHaveCount(0);
  });
});
