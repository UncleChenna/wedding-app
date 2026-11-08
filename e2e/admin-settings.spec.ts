import { randomInt, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { adminTestEmail, signInAdmin } from "./support/admin-session";

test.describe("admin event settings", () => {
  test.skip(
    process.env.RUN_ADMIN_SETTINGS_TESTS !== "1",
    "Requires this worktree's local Auth and database, and ADMIN_EMAIL_ALLOWLIST including the test address",
  );
  test.setTimeout(300_000);
  let db: Sql;
  let saved: Record<string, unknown> | undefined;
  let table: number;
  let tableId: string | undefined;
  let itemId: string | undefined;
  const tag = "TICKET-101 fixture " + randomInt(100000, 900000);

  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    [saved] = await db`select * from event_settings where id = 1`;
    await db`insert into event_settings (id, ordering_open) values (1, true)
      on conflict (id) do update set ordering_open = true`;
    table = randomInt(100000, 900000);
    const [row] = await db<
      { id: string }[]
    >`insert into tables(number,name,capacity) values(${table},${tag},4) returning id`;
    tableId = row?.id;
    const [item] = await db<{ id: string }[]>`
      insert into menu_items(name, category_v2, station) values(${tag + " water"}, 'soft_drink', 'bar') returning id`;
    itemId = item?.id;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (tableId) await db`delete from orders where table_id = ${tableId}`;
      if (itemId) await db`delete from menu_items where id = ${itemId}`;
      if (tableId) await db`delete from tables where id = ${tableId}`;
      if (saved) {
        const { id: _id, updated_at: _updated, ...columns } = saved;
        await db`update event_settings set ${db(columns)} where id = 1`;
      } else await db`delete from event_settings where id = 1`;
    } finally {
      await db.end();
    }
  });

  const order = (request: APIRequestContext) =>
    request.post("/api/orders", {
      data: {
        clientRequestId: randomUUID(),
        table,
        items: [{ menuItemId: itemId, quantity: 1 }],
        note: "",
      },
    });

  test("saving updates the invitation and the order limits straight away", async ({
    page,
    request,
    browser,
    baseURL,
  }, info) => {
    await signInAdmin(page, request, adminTestEmail(info.project.name, "settings"));
    await page
      .getByRole("navigation", { name: "Admin" })
      .getByRole("link", { name: "Settings" })
      .click();
    await expect(page.getByRole("heading", { name: "Event settings", level: 1 })).toBeVisible();

    // A cutoff after the wedding is refused, and what was typed stays.
    await page.getByLabel("Venue time zone").fill("Africa/Lagos");
    await page.getByLabel("Wedding date").fill("2026-12-19");
    await page.getByLabel("RSVP cutoff").fill("2026-12-19T10:00");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(
      page.getByText("Choose a cutoff before the wedding day. Replies lock on the day anyway."),
    ).toBeVisible();
    await expect(page.getByLabel("RSVP cutoff")).toBeFocused();
    await expect(page.getByLabel("Venue time zone")).toHaveValue("Africa/Lagos");

    const venue = tag + " Garden Hall";
    await page.getByLabel("RSVP cutoff").fill("2026-12-12T18:00");
    await page.getByLabel("Venue", { exact: true }).fill(venue);
    await page.getByLabel("Wait between orders (seconds)").fill("0");
    await page.getByLabel("Open orders per table").fill("10");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.locator("form").getByRole("status")).toHaveText(
      "Saved. Invitations and order limits use these now.",
    );
    const [stored] = await db<
      { venue: string; lock: Date }[]
    >`select venue, rsvp_lock_at as lock from event_settings where id = 1`;
    expect(stored?.venue).toBe(venue);
    expect(stored?.lock.toISOString()).toBe("2026-12-12T17:00:00.000Z");

    // The invitation page shows the new venue on its next load.
    const [invitation] = await db<
      { token: string }[]
    >`select token from invitations where status <> 'draft' and status <> 'revoked' limit 1`;
    const guest = await browser.newContext({ baseURL });
    try {
      const invite = await guest.newPage();
      await invite.goto("/i/" + invitation?.token);
      await expect(invite.getByText(venue, { exact: true })).toBeVisible();
    } finally {
      await guest.close();
    }

    // With no cooldown, a table can order twice in a row; a long cooldown refuses the next one.
    expect((await order(request)).status()).toBe(201);
    expect((await order(request)).status()).toBe(201);
    await page.getByLabel("Wait between orders (seconds)").fill("3600");
    await page.getByRole("button", { name: "Save settings" }).click();
    // The message reads the same as the first save, so wait for the stored value itself.
    await expect
      .poll(
        async () =>
          (await db`select order_cooldown_seconds as s from event_settings where id = 1`)[0]?.s,
      )
      .toBe(3600);
    const refused = await order(request);
    expect(refused.status()).toBe(422);
    expect(await refused.json()).toMatchObject({ status: "rejected", reason: "cooldown" });

    // Edit forms rerender after the save; disable transitions so theme settling can finish.
    await page.addStyleTag({
      content:
        "*, *::before, *::after { transition: none !important; animation: none !important; }",
    });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        if (width === 375) expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const dir = "docs/reviews/TICKET-101/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: dir + "/" + width + "-settings.png" });
      }
  });
});
