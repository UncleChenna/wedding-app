import { randomBytes, randomInt, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("denied camera recovers through companion search and exact manual admission retry", async ({
  page,
  context,
}, info) => {
  test.skip(
    process.env.RUN_ADMISSION_JOURNEY !== "1",
    "Requires owned isolated synthetic database",
  );
  test.setTimeout(120000);
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  const db = postgres(url, { max: 1 });
  const invitation = randomUUID(),
    staff = randomUUID(),
    table = randomUUID();
  const unique = randomUUID().slice(0, 8);
  const primaryName = `Ada Synthetic Household ${unique}`,
    companionName = `Chidi Adébayo Companion ${unique}`;
  const venue = `manual-${randomUUID()}`,
    tableNumber = randomInt(100000, 999999);
  const salt = randomBytes(32),
    pin = String(randomInt(100000, 1000000));
  const pinHash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic manual gate','gate',${pinHash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into tables(id,number,capacity) values(${table},${tableNumber},8)`;
    await db`insert into invitations(id,token,status,table_id) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes',${table})`;
    await db`insert into guests(invitation_id,name,is_primary,dietary_notes) values(${invitation},${primaryName},true,'PRIVATE DIET MARKER'),(${invitation},${companionName},false,'PRIVATE DIET MARKER')`;
    await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,3,'PRIVATE RSVP MARKER')`;
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            throw new DOMException("Denied", "NotAllowedError");
          },
        },
      }),
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect(
      (
        await context.request.post("/api/checkin/manual", {
          data: { operation: "search", query: "Adebayo" },
        })
      ).status(),
    ).toBe(403);
    await page.goto("/checkin");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Open camera", exact: true }).click();
    await expect(
      page.getByText(/Allow camera access in your browser’s site settings/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Find guest by name", exact: true }).click();
    await expect(page.getByLabel("Guest name")).toBeFocused();
    await page.getByLabel("Guest name").fill(`adebayo ${unique}`);
    await page.getByRole("button", { name: "Find guest", exact: true }).click();
    await expect(page.getByText(`Matched name: ${companionName}`)).toBeVisible();
    async function capture(state: string) {
      for (const theme of themes) {
        await applyTheme(page, theme);
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 812 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          const directory = `docs/reviews/TICKET-063/${info.project.name}`;
          mkdirSync(directory, { recursive: true });
          await page.screenshot({
            path: `${directory}/${state}-${theme.id}-${width}.png`,
            fullPage: true,
          });
        }
        expect(await scanA11y(page)).toEqual([]);
      }
      await page.setViewportSize({ width: 375, height: 812 });
    }
    await capture("matches");
    await page.getByRole("button", { name: new RegExp(primaryName) }).click();
    await expect(page.getByLabel("How many are here?")).toHaveValue("3");
    await expect(page.getByText(String(tableNumber), { exact: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("PRIVATE DIET MARKER");
    await expect(page.locator("body")).not.toContainText("PRIVATE RSVP MARKER");
    expect(
      await db`select admitted_people,input_method,result from scan_events where invitation_id=${invitation}`,
    ).toEqual([{ admitted_people: 0, input_method: "manual", result: "valid" }]);
    await capture("choose-count");
    await page.getByLabel("How many are here?").fill("1");
    const attempts: string[] = [];
    await page.route("**/api/checkin/manual", async (route) => {
      const body = route.request().postDataJSON() as { operation?: string };
      if (body.operation !== "admit") return route.continue();
      attempts.push(route.request().postData() ?? "");
      const response = await route.fetch();
      if (attempts.length === 1) {
        expect((await response.json()).state).toBe("recorded");
        await route.abort("connectionfailed");
      } else await route.fulfill({ response });
    });
    await page.getByRole("button", { name: "Admit 1 guest", exact: true }).click();
    await expect(page.getByRole("button", { name: "Retry this admission" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to camera" })).toBeDisabled();
    await expect(page.getByLabel("Guest name")).toBeDisabled();
    await capture("uncertain");
    await page.getByRole("button", { name: "Retry this admission" }).click();
    await expect(page.getByRole("heading", { name: "Already recorded" })).toBeVisible();
    expect(attempts).toHaveLength(2);
    expect(attempts[1]).toBe(attempts[0]);
    expect(
      await db`select admitted_people from admission_counters where invitation_id=${invitation}`,
    ).toEqual([{ admitted_people: 1 }]);
    expect(
      await db`select input_method,admitted_people from scan_events where invitation_id=${invitation} and admitted_people>0`,
    ).toEqual([{ input_method: "manual", admitted_people: 1 }]);
    await capture("duplicate");
    await page.unroute("**/api/checkin/manual");
    await page.getByRole("button", { name: "Find guest", exact: true }).click();
    await page.getByRole("button", { name: new RegExp(primaryName) }).click();
    await expect(page.getByLabel("How many are here?")).toHaveValue("2");
    await db`update invitations set token_version=2 where id=${invitation}`;
    await page.getByRole("button", { name: "Admit 2 guests", exact: true }).click();
    await expect(page.getByText(/This pass has been revoked or replaced/)).toBeVisible();
    expect(
      await db`select admitted_people from admission_counters where invitation_id=${invitation}`,
    ).toEqual([{ admitted_people: 1 }]);
    await capture("replaced");
  } finally {
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db.end();
  }
});
