import { randomInt, randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { test, expect } from "./fixtures";
import { assertDatabaseTarget } from "../scripts/database-target";

test("positive table selection, menu and order receipt have no guest quality errors", async ({
  page,
}) => {
  test.skip(process.env.RUN_GUEST_JOURNEY !== "1", "Requires isolated guest journey database");
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const tableId = randomUUID(),
    mealId = randomUUID(),
    number = randomInt(100000, 900000);
  const venue = `quality-${randomUUID()}`,
    meal = `Quality meal ${randomUUID().slice(0, 8)}`;
  try {
    if ((await db`select id from event_settings where id=1`).length)
      throw new Error("Guest quality fixture requires empty isolated event settings");
    await db`insert into event_settings(id,venue,ordering_open) values(1,${venue},true)`;
    await db`insert into tables(id,number,capacity) values(${tableId},${number},8)`;
    await db`insert into menu_items(id,name,category_v2,station,is_available) values(${mealId},${meal},'meal','kitchen',true)`;
    for (const path of ["/", "/invite", "/lost-link", "/offline"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await page.goto("/order");
    await page.getByLabel("Table number", { exact: true }).fill(String(number));
    await page.getByLabel("Table number", { exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: `Table ${number}`, exact: true })).toBeVisible();
    await page.getByRole("button", { name: `Increase ${meal} quantity`, exact: true }).click();
    await page.getByRole("button", { name: "Send order", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "On its way. Sit back, we've got this.", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Received", { exact: true })).toBeVisible();
  } finally {
    // Keep synthetic order evidence and its FK targets; only remove this fixture's settings.
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
