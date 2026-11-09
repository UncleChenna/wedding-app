import { randomInt, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertAdminJourneyTarget } from "../scripts/admin-journey-ci";
import { signInAdmin } from "./support/admin-session";

// This flow displays OTP/TOTP and a one-time PIN: never capture its browser/session artifacts.
test.use({
  trace: "off",
  screenshot: "off",
  video: "off",
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
});
test.describe("complete admin setup journey", () => {
  test.skip(process.env.RUN_ADMIN_JOURNEY !== "1", "Requires the isolated admin journey runner");
  test.setTimeout(240_000);
  let db: Sql;
  let saved: { event_date: string; time_zone: string | null } | undefined;
  const tag = `Journey ${randomUUID().slice(0, 8)}`;
  const household = `${tag} household`;
  const tableNumber = randomInt(100000, 900000);
  const staffName = `${tag} kitchen`;
  const mealName = `${tag} rice`;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertAdminJourneyTarget(process.cwd(), process.env);
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    [saved] = await db<
      { event_date: string; time_zone: string | null }[]
    >`select event_date::text,time_zone from event_settings where id=1`;
    const future = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    await db`insert into event_settings(id,event_date,time_zone) values(1,${future},'Africa/Lagos') on conflict(id) do update set event_date=${future},time_zone='Africa/Lagos'`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      // Exact synthetic ownership; never disable audit guards or reset unrelated fixtures.
      await db`delete from registered_devices where registered_by_staff_id in (select id from staff where name=${staffName})`;
      await db`delete from staff where name=${staffName}`;
      await db`delete from invitations where household_name=${household}`;
      await db`delete from guest_import_batches where actor_id in (select id from auth.users where email=${`${process.env.ADMIN_JOURNEY_PREFIX}-mobile@example.test`} or email=${`${process.env.ADMIN_JOURNEY_PREFIX}-desktop@example.test`})`;
      await db`delete from tables where name=${household}`;
      await db`delete from menu_items where name=${mealName}`;
    } finally {
      if (saved)
        await db`update event_settings set event_date=${saved.event_date},time_zone=${saved.time_zone} where id=1`;
      else await db`delete from event_settings where id=1`;
      await db.end();
    }
  });
  test("imports, shares, seats, edits the menu and provisions a working staff PIN", async ({
    page,
    request,
    context,
    browser,
    baseURL,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/admin/guests");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
    await signInAdmin(
      page,
      request,
      `${process.env.ADMIN_JOURNEY_PREFIX}-${info.project.name}@example.test`,
    );
    const nav = page.getByRole("navigation", { name: "Admin", exact: true });
    await nav.getByRole("link", { name: "Guests", exact: true }).click();
    await page.getByRole("link", { name: "Import guests", exact: true }).click();
    const csv =
      "name,phone,email,party size,side,table,household\r\n" +
      `${tag} Ada,,${tag.replaceAll(" ", "-").toLowerCase()}@example.test,2,Family,,${household}\r\n` +
      `${tag} Uchenna,,,2,Family,,${household}\r\n`;
    await expect(page.getByLabel("Guest CSV file")).toBeEnabled();
    await page
      .getByLabel("Guest CSV file")
      .setInputFiles({ name: "household.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await page.getByRole("button", { name: "Preview guests", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Review your invitations" })).toBeVisible();
    expect(await db`select id from invitations where household_name=${household}`).toHaveLength(0);
    await page.getByRole("button", { name: "Import guests", exact: true }).click();
    await expect(page.getByText("1 draft invitation added.", { exact: true })).toBeVisible();
    const invitations = await db<
      { id: string; status: string; token: string }[]
    >`select id,status,token from invitations where household_name=${household}`;
    expect(invitations).toHaveLength(1);
    const invitation = invitations[0];
    if (!invitation) throw new Error("Imported household missing");
    expect(invitation.status).toBe("draft");
    expect(
      await db`select name from guests where invitation_id=${invitation.id} order by name`,
    ).toEqual([{ name: `${tag} Ada` }, { name: `${tag} Uchenna` }]);
    await nav.getByRole("link", { name: "Guests", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search guests" }).fill(household);
    const row = page.locator(`[data-invitation-id="${invitation.id}"]`);
    await row.getByRole("button", { name: `Invitation actions for ${household}` }).click();
    await row.getByRole("button", { name: "Share invitation", exact: true }).click();
    await page
      .getByRole("dialog", { name: "Share invitation", exact: true })
      .getByRole("button", { name: "Copy link", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Undo sharing record", exact: true }),
    ).toBeVisible();
    // Compare only a boolean to avoid printing the private link in failed assertions.
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(new URL(copied).pathname === `/i/${invitation.token}`).toBe(true);
    expect(
      await db`select status,sent_at is not null as recorded from invitations where id=${invitation.id}`,
    ).toEqual([{ status: "sent", recorded: true }]);
    expect(
      await db`select channel,undone_at from invitation_share_events where invitation_id=${invitation.id}`,
    ).toEqual([{ channel: "copy", undone_at: null }]);

    await nav.getByRole("link", { name: "Guests", exact: true }).click();
    await page.getByRole("link", { name: "Seating plan", exact: true }).click();
    await page.getByRole("button", { name: "Add table", exact: true }).click();
    await page.getByLabel("Table number", { exact: true }).fill(String(tableNumber));
    await page.getByLabel("Table name", { exact: true }).fill(household);
    await page.getByLabel("Seats", { exact: true }).fill("4");
    await page.getByRole("dialog").getByRole("button", { name: "Add table", exact: true }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.getByLabel("Find a household").fill(household);
    await page.getByRole("button", { name: `Assign table for ${household}`, exact: true }).click();
    await page
      .getByRole("dialog", { name: "Seat this household" })
      .getByLabel("Table", { exact: true })
      .selectOption({ label: `Table ${tableNumber} · ${household}` });
    await page.getByRole("button", { name: "Save assignment" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    expect(
      await db`select t.number from invitations i join tables t on t.id=i.table_id where i.id=${invitation.id}`,
    ).toEqual([{ number: tableNumber }]);
    expect(
      await db`select g.name,t.number from guests g join tables t on t.id=g.table_id where g.invitation_id=${invitation.id} order by g.name`,
    ).toEqual([
      { name: `${tag} Ada`, number: tableNumber },
      { name: `${tag} Uchenna`, number: tableNumber },
    ]);

    await nav.getByRole("link", { name: "Menu", exact: true }).click();
    const add = page.getByRole("region", { name: "Add an item" });
    await add.getByLabel("Name", { exact: true }).fill(mealName);
    await add.getByLabel("Category").selectOption("meal");
    await add.getByLabel("Prepared by").selectOption("kitchen");
    await add.getByRole("button", { name: "Add an item" }).click();
    await expect(add.getByRole("status")).toHaveText("Added to the menu.");
    const item = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name: mealName, exact: true }) });
    await item.locator("summary").click();
    await item.getByLabel("Description", { exact: true }).fill("Rice with seasonal vegetables");
    await item.getByLabel("Most per order").fill("2");
    await item.getByRole("button", { name: "Save item", exact: true }).click();
    await expect
      .poll(
        async () =>
          await db`select description,max_per_order from menu_items where name=${mealName}`,
      )
      .toEqual([{ description: "Rice with seasonal vegetables", max_per_order: 2 }]);

    await nav.getByRole("link", { name: "Staff", exact: true }).click();
    const person = page.getByRole("region", { name: "Add a person" });
    await person.getByLabel("Name").fill(staffName);
    await person.getByLabel("Works at").selectOption("kitchen");
    await person.getByRole("button", { name: "Add a person" }).click();
    await page.getByRole("button", { name: `Issue PIN: ${staffName}` }).click();
    const panel = page.getByRole("status", { name: `PIN for ${staffName}` });
    await expect(panel).toBeVisible();
    const pin = ((await panel.getByTestId("issued-pin").textContent()) ?? "").trim();
    expect(/^\d{6}$/.test(pin)).toBe(true);
    const [staff] = await db<
      { id: string; role: string; pin_hash: string }[]
    >`select id,role,pin_hash from staff where name=${staffName}`;
    expect(staff?.role).toBe("kitchen");
    expect(Boolean(staff?.pin_hash && !staff.pin_hash.includes(pin))).toBe(true);
    await page.reload();
    await expect(page.getByTestId("issued-pin")).toHaveCount(0);
    const staffContext = await browser.newContext({ baseURL });
    try {
      const device = await staffContext.newPage();
      await device.goto("/kitchen");
      await device.getByLabel("Your six-digit PIN").fill(pin);
      await device.getByLabel("Your six-digit PIN").press("Enter");
      await expect(device.getByText("You’re signed in.", { exact: true })).toBeVisible();
      await expect(device.getByText("This device is kitchen device.")).toBeVisible();
      expect(
        await db`select role from registered_devices where registered_by_staff_id=${staff?.id ?? ""}`,
      ).toEqual([{ role: "kitchen" }]);
    } finally {
      await staffContext.close();
    }
    mkdirSync("artifacts/TICKET-134", { recursive: true });
    writeFileSync(
      `artifacts/TICKET-134/${info.project.name}.json`,
      JSON.stringify(
        {
          project: info.project.name,
          authenticated: true,
          importedHouseholds: 1,
          importedMembers: 2,
          copiedAndRecorded: true,
          seatedMembers: 2,
          menuEdited: true,
          staffSignIn: true,
          externalDeliveryTested: false,
          physicalDeviceTested: false,
        },
        null,
        2,
      ),
    );
  });
});
