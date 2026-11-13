import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import postgres, { type Sql } from "postgres";
import { assertDatabaseTarget } from "../scripts/database-target";
import { retireInvitationFixtures } from "./support/invitation-fixtures";
import { expect, test } from "@playwright/test";

let fixturePath: string | undefined;
let invitationId = "";
let database: Sql | undefined;
let createdSettings = false;
const fixtureVenue = `TICKET-119 synthetic ${randomUUID()}`;

test.beforeAll(async () => {
  if (process.env.RUN_IMAGE_BUDGET !== "1") return;
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  database = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const created =
    await database`insert into event_settings(id,venue,event_date,time_zone) values(1,${fixtureVenue},'2099-12-19','Etc/UTC') on conflict(id) do nothing returning id`;
  createdSettings = created.length > 0;
  const token = randomBytes(32).toString("base64url");
  const [invitation] = await database<
    { id: string }[]
  >`insert into invitations(token,status,household_name,max_tag_alongs) values(${token},'sent','Synthetic image-budget household',0) returning id`;
  if (!invitation) throw new Error("Missing isolated image fixture");
  invitationId = invitation.id;
  await database`insert into guests(invitation_id,name,is_primary) values(${invitationId},'Synthetic image guest',true)`;
  fixturePath = `/i/${token}`;
});

test.afterAll(async () => {
  if (!database) return;
  try {
    await retireInvitationFixtures(database, [invitationId].filter(Boolean));
    if (createdSettings)
      await database`delete from event_settings where id=1 and venue=${fixtureVenue}`;
  } finally {
    await database.end();
  }
});

/** Can use a disposable private invitation path; never save the invitation URL in evidence. */
test("mobile invitation photographs stay within the 150 KB delivery budget", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const delivered: { status: number; type: string; bytes: number }[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", (response) => {
    if (!response.url().includes("/_next/image?")) return;
    pending.push(
      (async () => {
        const body = await response.body();
        delivered.push({
          status: response.status(),
          type: response.headers()["content-type"] ?? "",
          bytes: body.byteLength,
        });
      })(),
    );
  });
  await page.goto(fixturePath ?? process.env.INVITATION_IMAGE_PATH ?? "/dev/invitation/letter");
  const photographs = page.locator("main img[srcset]");
  await expect(photographs.first()).toBeVisible();
  await expect
    .poll(() =>
      photographs.evaluateAll((images) =>
        images.every(
          (image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  await Promise.all(pending);
  expect(delivered.length).toBeGreaterThan(0);
  for (const image of delivered) {
    expect(image.status).toBe(200);
    expect(image.type).toMatch(/^image\/(avif|webp)/);
    expect(image.bytes).toBeLessThanOrEqual(150_000);
  }
  mkdirSync("artifacts/TICKET-119", { recursive: true });
  writeFileSync(
    "artifacts/TICKET-119/mobile-image-budget.json",
    JSON.stringify(
      {
        width: 375,
        deviceScaleFactor: await page.evaluate(() => devicePixelRatio),
        privateFixture: Boolean(fixturePath ?? process.env.INVITATION_IMAGE_PATH),
        images: delivered,
      },
      null,
      2,
    ) + "\n",
  );
});
