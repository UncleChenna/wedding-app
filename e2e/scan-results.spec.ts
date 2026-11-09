import {
  createPrivateKey,
  randomBytes,
  randomInt,
  randomUUID,
  scryptSync,
  sign,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres from "postgres";
import QRCode from "qrcode";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("live gate result uses current seating and accepted history without admitting", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(
    process.env.RUN_SCAN_RESULTS_JOURNEY !== "1",
    "Requires owned isolated synthetic database",
  );
  test.setTimeout(120000);
  process.loadEnvFile(".env.local");
  const url = process.env.DATABASE_URL ?? "";
  assertDatabaseTarget(url, { localOnly: true });
  const db = postgres(url, { max: 1 });
  const invitation = randomUUID(),
    staff = randomUUID(),
    device = randomUUID(),
    table = randomUUID();
  const venue = `scan-result-${randomUUID()}`,
    number = randomInt(10000, 100000);
  const salt = randomBytes(32),
    pin = String(randomInt(100000, 1000000));
  const pinHash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic result gate','gate',${pinHash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into registered_devices(id,name,role,registered_by_staff_id) values(${device},'Synthetic result scanner','gate',${staff})`;
    await db`insert into tables(id,number,capacity) values(${table},${number},8)`;
    await db`insert into invitations(id,token,status,table_id) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes',${table})`;
    await db`insert into guests(invitation_id,name,is_primary,dietary_notes) values(${invitation},'Synthetic Guest',true,'PRIVATE DIETARY MARKER')`;
    await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,3,'PRIVATE RSVP MARKER')`;
    const body = encodeGatePassPayload({ v: 1, kid: "scan-test", inv: invitation, ver: 1, iat: 0 });
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      format: "der",
      type: "pkcs8",
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
            const stream = canvas.captureStream(15);
            const paint = () => ctx.drawImage(image, 0, 0);
            paint();
            const timer = setInterval(paint, 50);
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
    const denied = await context.request.post("/api/checkin/read", {
      data: { qr: `${baseURL}/p/${token}` },
    });
    expect(denied.status()).toBe(403);
    expect(await denied.json()).toEqual({ error: "Sign-in required." });
    await page.goto("/checkin");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Open camera" }).click();
    const valid = page.getByRole("heading", { name: "Valid pass", exact: true });
    await expect(valid).toBeVisible();
    await expect(page.getByText(`Table ${number}`, { exact: true })).toBeInViewport();
    await expect(valid).toBeInViewport();
    await expect(page.getByText("Synthetic Guest", { exact: true })).toBeInViewport();
    await expect(page.getByText(/No admission has been recorded/)).toBeVisible();
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(0);
    expect(await page.content()).not.toMatch(/PRIVATE DIETARY MARKER|PRIVATE RSVP MARKER/);
    // Moving the household to a different table does not require a new signed QR.
    const reassignedTable = randomUUID();
    await db`insert into tables(id,number,capacity) values(${reassignedTable},${number + 1},8)`;
    await db`update invitations set table_id=${reassignedTable} where id=${invitation}`;
    await page.getByRole("button", { name: "Scan next pass" }).focus();
    await page.getByRole("button", { name: "Scan next pass" }).press("Enter");
    await expect(page.getByText(`Table ${number + 1}`, { exact: true })).toBeVisible();
    await db`update invitations set table_id=null where id=${invitation}`;
    await page.getByRole("button", { name: "Scan next pass" }).click();
    await expect(page.getByText("Table not assigned", { exact: true })).toBeVisible();
    const folder = `docs/reviews/TICKET-060/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    const states = [
      "Valid pass",
      "Already used",
      "Revoked pass",
      "Replaced pass",
      "Not RSVP’d",
      "Invalid pass",
    ];
    for (const [index, title] of states.entries()) {
      if (index === 1)
        await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source) values(${randomUUID()},${invitation},${staff},${device},now(),'valid','valid',3,3,'online')`;
      if (index === 2) await db`update invitations set status='revoked' where id=${invitation}`;
      if (index === 3)
        await db`update invitations set status='rsvp_yes',token_version=2 where id=${invitation}`;
      if (index === 4)
        await db`update invitations set status='sent',token_version=1 where id=${invitation}`;
      if (index === 5) await db`update invitations set status='draft' where id=${invitation}`;
      if (index) await page.getByRole("button", { name: "Scan next pass" }).click();
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(
        page
          .locator('[tabindex="-1"]')
          .filter({ has: page.getByRole("heading", { name: title, exact: true }) }),
      ).toBeFocused();
      if (index === 1) {
        await expect(
          page.getByText(/Synthetic result gate · Synthetic result scanner/),
        ).toBeVisible();
        await expect(page.getByText(/UTC \(server receipt\)/)).toBeVisible();
      }
      for (const theme of themes) {
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 812 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          expect(
            await page.locator("button,a").evaluateAll((elements) =>
              elements
                .filter((element) => {
                  const box = element.getBoundingClientRect();
                  return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
                })
                .map((element) => element.textContent),
            ),
          ).toEqual([]);
          await page.screenshot({
            path: `${folder}/${index}-${theme.id}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
    const response = await context.request.post("/api/checkin/read", {
      data: { qr: `${baseURL}/p/${token}` },
    });
    expect(response.headers()["cache-control"]).toBe("private, no-store");
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(1);
  } finally {
    // Append-only synthetic scan evidence remains in this isolated database;
    // no guard is disabled and no recorded arrival is deleted for test cleanup.
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db.end();
  }
});
