import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
test.use({ trace: "off", screenshot: "off", video: "off" });
test("two offline devices report four each, retain one conflict, and show it on both scanners", async ({
  page,
  context,
  browser,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_SCANNER_UPDATES !== "1", "Requires owned Supabase Realtime");
  test.setTimeout(120_000);
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
  const actor = randomUUID(),
    invitation = randomUUID(),
    venue = `TICKET-067-${randomUUID()}`;
  const name = `Conflict guest ${invitation.slice(0, 8)}`;
  const pin = String(randomInt(100000, 1000000)),
    salt = randomBytes(32);
  const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  const secondContext = await browser.newContext({
    baseURL,
    viewport: { width: 375, height: 812 },
    reducedMotion: "reduce",
  });
  const second = await secondContext.newPage();
  const [previous] = await db<
    { venue: string | null; event_date: string | null; time_zone: string | null }[]
  >`select venue,event_date::text,time_zone from event_settings where id=1`;
  let notifications = 0;
  for (const target of [page, second])
    target.on("websocket", (socket) =>
      socket.on("framereceived", ({ payload }) => {
        if (payload.toString().includes("checkin.recorded")) notifications++;
      }),
    );
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC') on conflict(id) do update set venue=excluded.venue,event_date=excluded.event_date,time_zone=excluded.time_zone`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${actor},'Synthetic conflict operator','gate',${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into invitations(id,token,status,household_name) values(${invitation},${randomBytes(32).toString("base64url")},'rsvp_yes',${name})`;
    await db`insert into guests(invitation_id,name,is_primary) values(${invitation},${name},true)`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${invitation},true,4)`;
    expect((await page.request.get("/api/checkin/conflicts")).status()).toBe(403);
    for (const target of [page, second]) {
      await target.setViewportSize({ width: 375, height: 812 });
      await target.goto("/checkin");
      await target.getByLabel("Your six-digit PIN").fill(pin);
      await target.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(target.getByText("Guest list saved just now.")).toBeVisible({ timeout: 20000 });
      await target.context().setOffline(true);
      await target.getByRole("button", { name: "Find guest by name", exact: true }).click();
      await target.getByLabel("Guest name").fill(name);
      await target.getByRole("button", { name: "Find guest", exact: true }).click();
      await target.getByRole("button", { name, exact: true }).click();
      await target.getByRole("spinbutton", { name: "Guests entering now" }).fill("4");
      await target.getByRole("button", { name: "Save offline entry", exact: true }).click();
      await expect(
        target.getByRole("heading", { name: "Entry saved on this phone", exact: true }),
      ).toBeVisible();
    }
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(0);
    await context.setOffline(false);
    await page.getByRole("button", { name: "Retry sync", exact: true }).click();
    await expect
      .poll(async () => {
        const [row] = await db<
          { admitted_people: number }[]
        >`select admitted_people from admission_counters where invitation_id=${invitation}`;
        return row?.admitted_people;
      })
      .toBe(4);
    const started = Date.now();
    await secondContext.setOffline(false);
    await second.getByRole("button", { name: "Retry sync", exact: true }).click();
    for (const target of [page, second]) {
      const list = target.getByRole("region", { name: "Entry conflicts" });
      const entry = list.getByRole("listitem").filter({
        has: target.getByRole("heading", { name, exact: true }),
      });
      await expect(entry.getByRole("heading", { name, exact: true })).toBeVisible({
        timeout: 2000,
      });
      await expect(
        entry.getByText("4 reported entering · 0 added to the guest count"),
      ).toBeVisible();
    }
    const elapsedMs = Date.now() - started;
    expect(elapsedMs).toBeLessThan(2000);
    expect(notifications).toBeGreaterThan(0);
    const events = await db<
      {
        id: string;
        conflict: boolean;
        device_id: string;
        reported_people: number;
        admitted_people: number;
      }[]
    >`select id,conflict,device_id,reported_people,admitted_people from scan_events where invitation_id=${invitation} and reported_people>0 order by received_at`;
    expect(events).toHaveLength(2);
    expect(new Set(events.map((row) => row.device_id)).size).toBe(2);
    expect(events.map((row) => row.reported_people)).toEqual([4, 4]);
    expect(events.map((row) => row.admitted_people)).toEqual([4, 0]);
    expect(events.filter((row) => row.conflict)).toHaveLength(1);
    const conflict = events.find((row) => row.conflict);
    if (!conflict) throw new Error("Conflict evidence missing");
    await db`insert into scan_resolution_notes(event_id,request_id,admin_id,resolution) values(${conflict.id},${randomUUID()},${randomUUID()},'explained')`;
    await expect(
      second
        .getByRole("region", { name: "Entry conflicts" })
        .getByRole("listitem")
        .filter({
          has: second.getByRole("heading", { name, exact: true }),
        })
        .getByText("Discrepancy explained — original evidence retained."),
    ).toBeVisible({ timeout: 10000 });
    expect(
      await db`select admitted_people from admission_counters where invitation_id=${invitation}`,
    ).toMatchObject([{ admitted_people: 4 }]);
    const folder = `docs/reviews/TICKET-067/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    writeFileSync(`${folder}/timing.json`, JSON.stringify({ elapsedMs, notifications }, null, 2));
    for (const theme of themes) {
      await applyTheme(second, theme);
      expect(await scanA11y(second)).toEqual([]);
      expect(await second.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await second.screenshot({ path: `${folder}/${theme.id}-375.png`, fullPage: true });
    }
    const privateResponse = await second.request.get("/api/checkin/conflicts");
    expect(privateResponse.headers()["cache-control"]).toContain("private, no-store");
    expect(await privateResponse.text()).not.toMatch(/pin_hash|token|dietary|email/);
  } finally {
    await secondContext.close();
    await db`update staff set revoked_at=now(),pin_hash=null,pin_issued_at=null,pin_expires_at=null where id=${actor}`;
    if (previous)
      await db`update event_settings set venue=${previous.venue},event_date=${previous.event_date},time_zone=${previous.time_zone} where id=1 and venue=${venue}`;
    else await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
