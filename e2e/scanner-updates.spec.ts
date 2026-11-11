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
import { expect, test, type Page } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.use({ trace: "off", screenshot: "off", video: "off" });
async function camera(page: Page, imageUrl: string) {
  await page.addInitScript((src) => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 512;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Canvas unavailable");
          const image = new Image();
          image.src = src;
          await image.decode();
          const paint = () => context.drawImage(image, 0, 0);
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
  }, imageUrl);
}
for (const mode of ["realtime", "polling", "uncertain"] as const) {
  test(`another scanner updates the visible pass without rescanning (${mode})`, async ({
    page,
    browser,
    baseURL,
  }, info) => {
    test.skip(process.env.RUN_SCANNER_UPDATES !== "1", "Requires owned Supabase Realtime");
    test.setTimeout(120_000);
    if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    const db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const otherContext = await browser.newContext({
      baseURL,
      viewport: { width: 375, height: 812 },
      reducedMotion: "reduce",
    });
    const other = await otherContext.newPage();
    const releaseReceipt = Promise.withResolvers<void>();
    const actor = randomUUID(),
      invitation = randomUUID(),
      venue = `TICKET-068-${randomUUID()}`;
    const pin = String(randomInt(100000, 1000000)),
      salt = randomBytes(32);
    const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
    const [previous] = await db<
      { venue: string | null; event_date: string | null; time_zone: string | null }[]
    >`select venue,event_date::text,time_zone from event_settings where id=1`;
    try {
      await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC') on conflict(id) do update set venue=excluded.venue,event_date=excluded.event_date,time_zone=excluded.time_zone`;
      await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${actor},'Synthetic updates operator','gate',${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
      await db`insert into invitations(id,token,status,household_name) values(${invitation},${randomBytes(32).toString("base64url")},'rsvp_yes','Updates household')`;
      await db`insert into guests(invitation_id,name,is_primary,dietary_notes,email) values(${invitation},'Updates guest',true,'PRIVATE DIETARY MARKER','private@example.invalid')`;
      await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,2,'PRIVATE RSVP MARKER')`;
      const body = encodeGatePassPayload({
        v: 1,
        kid: "scanner-updates-test",
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
      const image = await QRCode.toDataURL(`${baseURL}/p/${token}`, { width: 512, margin: 4 });
      let joined = false,
        notifications = 0;
      other.on("websocket", (socket) =>
        socket.on("framereceived", ({ payload }) => {
          const text = payload.toString();
          if (
            text.includes("realtime:station:gate") &&
            text.includes("phx_reply") &&
            text.includes('"ok"')
          )
            joined = true;
          if (text.includes("checkin.recorded")) {
            notifications++;
            expect(text).not.toMatch(/PRIVATE|private@example|Updates guest/);
          }
        }),
      );
      if (mode === "polling")
        await otherContext.routeWebSocket(/realtime/, (socket) => socket.close());
      for (const target of [page, other]) {
        await camera(target, image);
        await target.setViewportSize({ width: 375, height: 812 });
        await target.goto("/checkin");
        await target.getByLabel("Your six-digit PIN").fill(pin);
        await target.getByRole("button", { name: "Sign in", exact: true }).click();
        await expect(target.getByText("Guest list saved just now.")).toBeVisible({
          timeout: 20_000,
        });
        if (target === other && mode === "realtime") {
          await expect(target.getByText(/Camera ready for an offline reload/)).toBeVisible();
          joined = false;
          await otherContext.setOffline(true);
          await target.reload();
          await expect(
            target.getByRole("heading", { name: "Gate check-in", exact: true }),
          ).toBeVisible();
          await otherContext.setOffline(false);
        }
        await target.getByRole("button", { name: "Open camera" }).click();
        await expect(
          target.getByRole("heading", { name: "Valid pass", exact: true }),
        ).toBeVisible();
      }
      if (mode !== "polling") await expect.poll(() => joined).toBe(true);
      const requestIds: unknown[] = [];
      if (mode === "uncertain") {
        other.on("request", (request) => {
          if (request.url().endsWith("/api/checkin/admit"))
            requestIds.push(request.postDataJSON().clientEventId);
        });
        await other.route("**/api/checkin/admit", async (route) => {
          const committed = await route.fetch();
          expect(committed.status()).toBe(200);
          expect((await committed.json()).state).toBe("recorded");
          await releaseReceipt.promise;
          await route.abort();
        });
      }
      const started = Date.now();
      if (mode === "uncertain") {
        await other.getByRole("button", { name: "Admit 2 guests", exact: true }).click();
        await expect(other.getByText(/updated since this check/)).toBeVisible({ timeout: 2000 });
      } else {
        await page.getByRole("button", { name: "Admit 2 guests", exact: true }).click();
        await expect(
          page.getByRole("heading", { name: "Admission recorded", exact: true }),
        ).toBeVisible();
        await expect(other.getByRole("heading", { name: "Already used", exact: true })).toBeVisible(
          { timeout: mode === "polling" ? 15000 : 2000 },
        );
      }
      const elapsed = Date.now() - started;
      expect(elapsed).toBeLessThan(mode === "polling" ? 15000 : 2000);
      if (mode !== "polling") expect(notifications).toBeGreaterThan(0);
      else expect(notifications).toBe(0);
      if (mode === "uncertain") {
        releaseReceipt.resolve();
        await expect(other.getByRole("button", { name: "Retry this admission" })).toBeVisible();
        await other.unroute("**/api/checkin/admit");
      }
      expect(
        await db`select admitted_people from admission_counters where invitation_id=${invitation}`,
      ).toMatchObject([{ admitted_people: 2 }]);
      if (mode !== "uncertain")
        await expect(other.getByText("Party of 2 · 2 admitted so far")).toBeVisible();
      expect(await other.locator("body").innerText()).not.toMatch(/PRIVATE|private@example/);
      const folder = `docs/reviews/TICKET-068/${info.project.name}`;
      mkdirSync(folder, { recursive: true });
      writeFileSync(
        `${folder}/${mode}-timing.json`,
        `${JSON.stringify({ elapsedMs: elapsed, notifications }, null, 2)}\n`,
      );
      for (const theme of themes) {
        await applyTheme(other, theme);
        expect(await scanA11y(other)).toEqual([]);
        for (const control of await other.getByRole("button").all()) {
          if (!(await control.isVisible())) continue;
          const box = await control.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
        for (const width of [375, 768, 1280]) {
          await other.setViewportSize({ width, height: 812 });
          expect(
            await other.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
        }
        await other.setViewportSize({ width: 375, height: 812 });
        await other.screenshot({ path: `${folder}/${mode}-${theme.id}.png`, fullPage: true });
      }
      if (mode === "uncertain") {
        const retry = other.getByRole("button", { name: "Retry this admission" });
        await retry.focus();
        await expect(retry).toBeFocused();
        await other.keyboard.press("Enter");
        await expect(
          other.getByRole("heading", { name: "Already recorded", exact: true }),
        ).toBeVisible();
        expect(requestIds).toHaveLength(2);
        expect(requestIds[1]).toBe(requestIds[0]);
        expect(
          await db`select id from scan_events where invitation_id=${invitation} and admitted_people > 0`,
        ).toHaveLength(1);
      }
      await info.attach(`${mode}-timing`, {
        body: JSON.stringify({ elapsedMs: elapsed, notifications }),
        contentType: "application/json",
      });
    } finally {
      releaseReceipt.resolve();
      await otherContext.close();
      await db`update staff set revoked_at=now(),pin_hash=null,pin_issued_at=null,pin_expires_at=null where id=${actor}`;
      if (previous)
        await db`update event_settings set venue=${previous.venue},event_date=${previous.event_date},time_zone=${previous.time_zone} where id=1 and venue=${venue}`;
      else await db`delete from event_settings where id=1 and venue=${venue}`;
      await db.end();
    }
  });
}
