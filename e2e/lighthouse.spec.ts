import { execFile } from "node:child_process";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { chromium, expect, test } from "@playwright/test";
import postgres from "postgres";
import { assessLighthouse, LIGHTHOUSE_POLICY } from "../scripts/lighthouse-gate";
import { assertDatabaseTarget } from "../scripts/database-target";
import { retireInvitationFixtures } from "./support/invitation-fixtures";

const execute = promisify(execFile);
test("mobile guest pages meet the recorded Lighthouse policy", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_LIGHTHOUSE_GATE !== "1", "Run the isolated Lighthouse gate");
  test.setTimeout(12 * 60_000);
  if (!baseURL) throw new Error("Owned production URL required");
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
  const invitation = randomUUID(),
    meal = randomUUID(),
    table = randomInt(1_000_000, 2_000_000);
  const token = randomBytes(32).toString("base64url");
  const venue = `Lighthouse synthetic ${randomUUID()}`;
  const output = resolve("artifacts/TICKET-116");
  mkdirSync(output, { recursive: true });
  const scores: { page: string; result: ReturnType<typeof assessLighthouse> }[] = [];
  try {
    const existing = await db`select id from event_settings where id=1`;
    if (existing.length) throw new Error("Lighthouse requires empty isolated event settings");
    await db`insert into event_settings(id,venue,event_date,time_zone,ordering_open) values(1,${venue},'2099-12-19','Etc/UTC',true)`;
    await db`insert into invitations(id,token,status,household_name,max_tag_alongs) values(${invitation},${token},'sent','Synthetic Lighthouse household',1)`;
    await db`insert into guests(invitation_id,name,is_primary) values(${invitation},'Ada Lighthouse',true)`;
    await db`insert into menu_items(id,name,category_v2,station,max_per_order,is_available) values(${meal},'Ọgbọnọ · Crème brûlée','meal','kitchen',5,true)`;
    await db`insert into tables(number,name,capacity) values(${table},'Synthetic Lighthouse table',8)`;
    await page.goto(`/i/${token}`);
    await page.getByRole("button", { name: "Count me in", exact: true }).click();
    const party = page.locator('section[aria-labelledby="party-heading"]');
    await party.getByLabel("Meal choice").selectOption(meal);
    await party.getByRole("button", { name: "Save guest details", exact: true }).click();
    await expect(party.getByRole("status")).toContainText("Your guest details are saved");
    const pass = await page
      .getByRole("link", { name: "Open your pass", exact: true })
      .getAttribute("href");
    if (!pass) throw new Error("Issued signed pass missing");
    const targets = [
      { name: "invitation-rsvp-saved", url: new URL(`/i/${token}`, baseURL).href },
      { name: "issued-pass", url: new URL(new URL(pass, baseURL).pathname, baseURL).href },
      {
        name: "order-menu",
        url: new URL("/order", baseURL).href,
        cookie: `wedding-table=${table}`,
      },
    ];
    for (const target of targets) {
      if (target.cookie)
        await context.addCookies([{ name: "wedding-table", value: String(table), url: baseURL }]);
      await page.goto(target.url);
      if (target.name === "issued-pass")
        await expect(page.getByRole("heading", { name: "Ada Lighthouse" })).toBeVisible();
      if (target.name === "order-menu")
        await expect(
          page.getByRole("button", { name: "Increase Ọgbọnọ · Crème brûlée quantity" }),
        ).toBeVisible();
      const reports: unknown[] = [];
      for (let run = 1; run <= LIGHTHOUSE_POLICY.runs; run++) {
        const path = resolve(output, `${target.name}-${run}.json`);
        await execute(
          "pnpm",
          [
            "dlx",
            `lighthouse@${LIGHTHOUSE_POLICY.version}`,
            target.url,
            "--config-path=./lighthouse.config.cjs",
            "--chrome-flags=--headless --no-sandbox",
            "--output=json",
            `--output-path=${path}`,
            "--quiet",
            ...(target.cookie
              ? [`--extra-headers=${JSON.stringify({ Cookie: target.cookie })}`]
              : []),
          ],
          {
            env: { ...process.env, CHROME_PATH: chromium.executablePath() },
            timeout: 120_000,
            maxBuffer: 1024 * 1024,
          },
        );
        reports.push(JSON.parse(readFileSync(path, "utf8")) as unknown);
      }
      const result = assessLighthouse(reports, target.url);
      scores.push({ page: target.name, result });
    }
    writeFileSync(
      resolve(output, "scores.json"),
      JSON.stringify({ policy: LIGHTHOUSE_POLICY, scores }, null, 2) + "\n",
    );
    await info.attach("lighthouse-scores", {
      body: JSON.stringify(scores),
      contentType: "application/json",
    });
    for (const score of scores)
      expect(score.result.passed, `${score.page}: ${JSON.stringify(score.result)}`).toBe(true);
  } finally {
    await retireInvitationFixtures(db, [invitation]);
    await db`delete from menu_items where id=${meal}`;
    await db`delete from tables where number=${table}`;
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
