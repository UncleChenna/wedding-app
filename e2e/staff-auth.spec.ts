import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";

function credential(pin: string) {
  const salt = randomBytes(32);
  const hash = scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$1$${salt.toString("hex")}$${hash.toString("hex")}`;
}

test.describe("staff PIN journey", () => {
  test.skip(
    process.env.RUN_STAFF_JOURNEY !== "1",
    "Use scripts/test-staff-journey.ts with an isolated database",
  );
  let db: Sql;
  const gateId = randomUUID();
  const kitchenId = randomUUID();
  const venue = `TICKET-031-${randomUUID()}`;
  const devices = new Set<string>();
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    // Never overwrite another test or a real event's settings.
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values
      (${gateId},'Synthetic gate','gate',${credential("012345")},now() - interval '1 minute','2099-12-20T06:00:00Z'),
      (${kitchenId},'Synthetic kitchen','kitchen',${credential("654321")},now() - interval '1 minute','2099-12-20T06:00:00Z')`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from registered_devices where registered_by_staff_id in (${gateId},${kitchenId})`;
      for (const device of devices)
        await db`delete from staff_pin_attempts where device_id=${device}`;
      await db`delete from staff where id in (${gateId},${kitchenId})`;
      await db`delete from event_settings where id=1 and venue=${venue}`;
    } finally {
      await db.end();
    }
  });

  test("wrong, locked, expired, successful and role-isolated sign-in", async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    await page.goto("/checkin");
    await expect(page.getByRole("heading", { name: "Gate check-in", exact: true })).toBeVisible();
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    for (let attempt = 0; attempt < 5; attempt++) {
      await page.getByLabel("Your six-digit PIN").fill("999999");
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(
        page.getByRole("form", { name: "Staff sign-in" }).getByRole("status"),
      ).toContainText(attempt === 4 ? "Too many attempts" : "didn’t match");
      const cookie = (await context.cookies()).find(
        (value) => value.name === "wedding-staff-device",
      );
      expect(cookie?.httpOnly).toBe(true);
      const device = cookie?.value.split(".")[0];
      if (!device) throw new Error("Missing signed device cookie");
      devices.add(device);
    }
    for (const device of devices)
      await db`update staff_pin_attempts set window_started_at=now() - interval '11 minutes' where device_id=${device}`;
    await db`update staff set pin_issued_at=now() - interval '2 hours', pin_expires_at=now() - interval '1 hour' where id=${gateId}`;
    await page.getByLabel("Your six-digit PIN").fill("012345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("form", { name: "Staff sign-in" }).getByRole("status"),
    ).toContainText("PIN has expired");
    await db`update staff set pin_expires_at='2099-12-20T06:00:00Z' where id=${gateId}`;
    await page.getByLabel("Your six-digit PIN").fill("012345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("You’re signed in.", { exact: true })).toBeVisible();
    const session = (await context.cookies()).find(
      (cookie) => cookie.name === "wedding-staff-session",
    );
    expect(session?.httpOnly).toBe(true);
    expect(session?.sameSite).toBe("Strict");
    expect(await page.content()).not.toContain("scrypt$");
    await page.goto("/kitchen");
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    await expect(page.getByText("You’re signed in.", { exact: true })).toHaveCount(0);
    await page.goto("/checkin");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/staff$/);
    await page.goto("/checkin");
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    for (const device of devices)
      await db`update registered_devices set revoked_at=now() where id=${device}`;
    await page.getByLabel("Your six-digit PIN").fill("012345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(
      page.getByRole("form", { name: "Staff sign-in" }).getByRole("status"),
    ).toContainText("didn’t match");
    // A separate browser represents the kitchen device, not the revoked gate phone.
    await context.clearCookies();
    await page.goto("/kitchen");
    await page.getByLabel("Your six-digit PIN").fill("654321");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("You’re signed in.", { exact: true })).toBeVisible();
    const kitchenDevice = (await context.cookies())
      .find((cookie) => cookie.name === "wedding-staff-device")
      ?.value.split(".")[0];
    if (!kitchenDevice) throw new Error("Missing kitchen device cookie");
    devices.add(kitchenDevice);
    await page.goto("/checkin");
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    await expect(page.getByText("You’re signed in.", { exact: true })).toHaveCount(0);
  });
});
