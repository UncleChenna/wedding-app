import {
  createPrivateKey,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  sign,
} from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import postgres from "postgres";
import QRCode from "qrcode";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("ten offline admissions survive reload and sync once through the authenticated product", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_OFFLINE_QUEUE !== "1", "Requires owned synthetic database");
  test.setTimeout(180_000);
  const failedAssets: string[] = [];
  page.on("requestfailed", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/_next/static/") || path.startsWith("/scanner-assets/"))
      failedAssets.push(path);
  });
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const staff = randomUUID(),
    invitation = randomUUID(),
    venue = `snapshot-${randomUUID()}`;
  const guestName = `Snapshot guest ${invitation.slice(0, 8)}`;
  const pin = String(randomInt(100000, 1000000)),
    salt = randomBytes(32);
  const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic snapshot operator','gate',${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into invitations(id,token,status,household_name) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes','Snapshot household')`;
    await db`insert into guests(invitation_id,name,is_primary,dietary_notes,email) values(${invitation},${guestName},true,'PRIVATE DIETARY MARKER','private@example.invalid')`;
    await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,20,'PRIVATE RSVP MARKER')`;
    const body = encodeGatePassPayload({
      v: 1,
      kid: "snapshot-test",
      inv: invitation,
      ver: 1,
      iat: 0,
    });
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      type: "pkcs8",
      format: "der",
    });
    const token = `${body}.${sign(null, Buffer.from(body), key).toString("base64url")}`;
    const qr = await QRCode.toDataURL(`${baseURL}/p/${token}`, { width: 512, margin: 4 });
    await page.addInitScript((src) => {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 512;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas unavailable");
            const image = new Image();
            image.src = src;
            await image.decode();
            const paint = () => ctx.drawImage(image, 0, 0);
            paint();
            const stream = canvas.captureStream(15),
              timer = setInterval(paint, 50);
            for (const track of stream.getTracks()) {
              const stop = track.stop.bind(track);
              track.stop = () => {
                clearInterval(timer);
                stop();
              };
            }
            return stream;
          },
        },
      });
    }, qr);
    await page.setViewportSize({ width: 375, height: 812 });
    expect((await page.request.get("/api/checkin/guest-snapshot")).status()).toBe(403);
    await page.goto("/checkin");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open camera" })).toBeInViewport();
    const response = await page.request.get("/api/checkin/guest-snapshot");
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.text()).not.toMatch(/PRIVATE|private@example|dietary_notes|pin_hash/);
    await expect(page.getByText("Guest list saved just now.")).toBeVisible({ timeout: 20_000 });
    const folder = `docs/reviews/TICKET-066/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    await context.setOffline(true);
    await page.getByRole("button", { name: "Open camera", exact: true }).click();
    try {
      await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
    } catch (error) {
      const diagnostics = JSON.stringify({
        failedAssets,
        worker: await page.evaluate(() => ({
          controlled: Boolean(navigator.serviceWorker.controller),
          online: navigator.onLine,
        })),
      });
      writeFileSync(info.outputPath("offline-startup.json"), diagnostics);
      await info.attach("offline-startup.json", {
        body: diagnostics,
        contentType: "application/json",
      });
      throw error;
    }
    const capture = async (state: string) => {
      for (const theme of themes) {
        await applyTheme(page, theme);
        await page.screenshot({ path: `${folder}/${theme.id}-${state}-375.png`, fullPage: true });
        expect(await scanA11y(page)).toEqual([]);
      }
    };
    await capture("offline-count");
    for (let count = 1; count <= 10; count++) {
      if (count === 10) {
        await page.getByRole("button", { name: "Find guest by name", exact: true }).click();
        await page.getByLabel("Guest name").fill(guestName);
        await page.getByRole("button", { name: "Find guest", exact: true }).click();
        await page.getByRole("button", { name: guestName, exact: true }).click();
        await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
      } else if (count > 1) {
        if (count === 6) {
          await page.reload();
          await page.getByRole("button", { name: "Open camera", exact: true }).click();
        } else await page.getByRole("button", { name: "Scan next pass", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
      }
      await page.getByRole("spinbutton", { name: "Guests entering now" }).fill("1");
      const save = page.getByRole("button", { name: "Save offline entry", exact: true });
      await save.focus();
      await save.press("Enter");
      await expect(
        page.getByRole("heading", { name: "Entry saved on this phone", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("status").filter({
          has: page.getByRole("heading", { name: "Entry saved on this phone", exact: true }),
        }),
      ).toBeFocused();
      if (count === 1) await capture("saved-local");
    }
    expect(
      await db`select id from scan_events where invitation_id=${invitation} and source='offline'`,
    ).toHaveLength(0);
    await context.setOffline(false);
    await page.getByRole("button", { name: "Retry sync", exact: true }).click();
    await expect
      .poll(async () => {
        const [row] = await db<
          { admitted: number }[]
        >`select admitted_people as admitted from admission_counters where invitation_id=${invitation}`;
        return row?.admitted ?? 0;
      })
      .toBe(10);
    await expect(page.getByText("No records are waiting for this operator.")).toBeVisible();
    await expect(page.getByText(/Waiting to sync with the gate records/)).toHaveCount(0);
    await expect(page.getByText(/Check the sync status below/)).toBeVisible();
    await page.getByRole("button", { name: "Retry sync", exact: true }).click();
    const [totals] = await db<
      { rows: number; people: number; ids: number }[]
    >`select count(*)::int as rows, sum(admitted_people)::int as people, count(distinct client_event_id)::int as ids from scan_events where invitation_id=${invitation} and source='offline'`;
    expect(totals).toEqual({ rows: 20, people: 10, ids: 20 });
    expect(
      await db`select input_method, sum(admitted_people)::int as people from scan_events where invitation_id=${invitation} and source='offline' and admitted_people>0 group by input_method order by input_method`,
    ).toEqual([
      { input_method: "manual", people: 1 },
      { input_method: "qr", people: 9 },
    ]);
    await capture("synced");
  } finally {
    await context.setOffline(false);
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
