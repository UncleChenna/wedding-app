import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { invitationSiteCopy } from "../src/modules/invitations/lib/copy";

test("TICKET-037 configured details and long names reach no-JavaScript HTML", async ({
  browser,
  baseURL,
}) => {
  test.skip(process.env.RUN_INVITATION_DETAILS_TESTS !== "1", "Requires isolated RSVP fixture");
  process.loadEnvFile(".env.local");
  const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
  expect(meta.path).toBe(process.cwd());
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 375, height: 812 },
  });
  let id: string | undefined;
  try {
    const [original] = await db<
      {
        venue: string | null;
        couple_names: string[];
        ceremony_time: string | null;
        map_url: string | null;
        dress_code: string | null;
      }[]
    >`select venue,couple_names,ceremony_time,map_url,dress_code from event_settings where id=1`;
    if (!original || original.venue !== "RSVP browser test only")
      throw new Error("Requires existing isolated RSVP fixture; refusing other settings");
    const token = randomBytes(32).toString("base64url");
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},'TICKET-037 test household','sent') returning id`;
    if (!row) throw new Error("Missing fixture");
    id = row.id;
    const longName = "A".repeat(80);
    await db`insert into guests(invitation_id,name,is_primary) values(${id},${longName},true)`;
    try {
      await db`update event_settings set couple_names=array[${longName},'Adaora'],ceremony_time='15:30',map_url='https://www.google.com/maps/search/?api=1&query=Kew+Gardens',dress_code='Test formal attire' where id=1 and venue='RSVP browser test only'`;
      const page = await context.newPage();
      await page.goto(`/i/${token}`);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(longName);
      await expect(page.getByText("Test formal attire")).toBeVisible();
      await expect(page.getByText("3:30 pm · Etc/UTC")).toBeVisible();
      await expect(page.getByRole("link", { name: "View the venue" })).toHaveAttribute(
        "href",
        "https://www.google.com/maps/search/?api=1&query=Kew+Gardens",
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.getByRole("link", { name: "Kindly reply" }).click();
      await expect(
        page.getByRole("button", { name: invitationSiteCopy.attendance.yes, exact: true }),
      ).toBeInViewport();
    } finally {
      await db`update event_settings set couple_names=${original.couple_names},ceremony_time=${original.ceremony_time},map_url=${original.map_url},dress_code=${original.dress_code} where id=1 and venue='RSVP browser test only'`;
    }
  } finally {
    await context.close();
    if (id) await db`delete from invitations where id=${id}`;
    await db.end();
  }
});
