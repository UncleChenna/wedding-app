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
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("authenticated private snapshot supports offline reads and erases on sign-out", async ({
  page,
  context,
  baseURL,
}, info) => {
  test.skip(process.env.RUN_GUEST_SNAPSHOT !== "1", "Requires owned synthetic database");
  test.setTimeout(180_000);
  if (!process.env.DATABASE_URL) process.loadEnvFile(".env.local");
  assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
  const db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
  const staff = randomUUID(),
    invitation = randomUUID(),
    venue = `snapshot-${randomUUID()}`;
  const pin = String(randomInt(100000, 1000000)),
    salt = randomBytes(32);
  const hash = `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
  try {
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values(${staff},'Synthetic snapshot operator','gate',${hash},now()-interval '1 minute','2099-12-20T06:00:00Z')`;
    await db`insert into invitations(id,token,status,household_name) values(${invitation},${randomUUID().replaceAll("-", "")},'rsvp_yes','Snapshot household')`;
    await db`insert into guests(invitation_id,name,is_primary,dietary_notes,email) values(${invitation},'Snapshot guest',true,'PRIVATE DIETARY MARKER','private@example.invalid')`;
    await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,2,'PRIVATE RSVP MARKER')`;
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
    const folder = `docs/reviews/TICKET-065/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    async function capture(state: string) {
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const theme of themes) {
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 812 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          expect(
            await page.locator("button,a").evaluateAll(
              (elements) =>
                elements.filter((el) => {
                  const b = el.getBoundingClientRect();
                  return b.width > 0 && b.height > 0 && (b.width < 44 || b.height < 44);
                }).length,
            ),
          ).toBe(0);
          await page.screenshot({
            path: `${folder}/${state}-${theme.id}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
    await capture("saved");
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText("Guest list saved just now.")).toBeVisible();
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
    await expect(page.getByText(/No entry is recorded by an offline check/)).toBeVisible();
    await expect(page.getByRole("spinbutton")).toHaveCount(0);
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(0);
    await capture("cached-valid");
    // Advance only this page's display clock, not the worker/server authority.
    // A 31-minute-old snapshot remains usable with an explicit stale warning.
    await page.clock.setFixedTime(new Date(Date.now() + 31 * 60_000));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      page.getByText("This list is over 30 minutes old. Refresh when connected."),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Valid pass", exact: true })).toBeVisible();
    await expect(
      page.getByText("List not refreshed for 31 min. New changes may not show."),
    ).toBeVisible();
    await capture("stale");
    await page.clock.setFixedTime(new Date());
    const device = randomUUID();
    await db`insert into registered_devices(id,name,role,registered_by_staff_id) values(${device},'Synthetic snapshot evidence','gate',${staff})`;
    await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source) values(${randomUUID()},${invitation},${staff},${device},now(),'valid','valid',2,2,'online')`;
    async function refreshAndRead(title: string) {
      await context.setOffline(false);
      await page.getByRole("button", { name: "Refresh guest list", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Refresh guest list", exact: true }),
      ).toBeEnabled();
      await context.setOffline(true);
      await page.reload();
      await page.getByRole("button", { name: "Open camera" }).click();
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(
        1,
      );
    }
    await refreshAndRead("Already used");
    await capture("cached-used");
    await db`update invitations set token_version=2 where id=${invitation}`;
    await refreshAndRead("Replaced pass");
    await capture("cached-replaced");
    await context.setOffline(false);
    await db`update invitations set status='revoked' where id=${invitation}`;
    await page.getByRole("button", { name: "Refresh guest list", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Refresh guest list", exact: true }),
    ).toBeEnabled();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect(page.getByRole("heading", { name: "Revoked pass", exact: true })).toBeVisible();
    await capture("cached-revoked");
    await context.setOffline(false);
    // A refusal after the initial valid check is new authoritative evidence.
    // Preserve historical admissions, give this synthetic party one remaining
    // place, then revoke after a fresh copy was genuinely saved on the device.
    await db`update invitations set status='rsvp_yes',token_version=1 where id=${invitation}`;
    await db`update rsvps set count_attending=3 where invitation_id=${invitation}`;
    await page.reload();
    await page.getByRole("button", { name: "Open camera" }).click();
    await expect(page.getByRole("button", { name: "Admit 1 guest", exact: true })).toBeVisible();
    const cachedStatus = () =>
      page.evaluate(async (id) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("wedding-scanner-guests-v1");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<string | null>((resolve, reject) => {
            const request = database.transaction("snapshot").objectStore("snapshot").get("current");
            request.onsuccess = () => {
              const saved = request.result as
                | {
                    snapshot?: {
                      invitations: { invitationId: string; status: string; partySize: number }[];
                    };
                  }
                | undefined;
              const row = saved?.snapshot?.invitations.find((entry) => entry.invitationId === id);
              resolve(row ? `${row.status}:${row.partySize}` : null);
            };
            request.onerror = () => reject(request.error);
          });
        } finally {
          database.close();
        }
      }, invitation);
    await expect.poll(cachedStatus).toBe("rsvp_yes:3");
    await context.route("**/api/checkin/guest-snapshot", (route) =>
      route.fulfill({ status: 503, body: "unavailable" }),
    );
    await db`update invitations set status='revoked' where id=${invitation}`;
    await page.getByRole("button", { name: "Admit 1 guest", exact: true }).click();
    await expect(
      page.getByText("This pass has been revoked or replaced. Ask the gate lead to check."),
    ).toBeVisible();
    await expect.poll(cachedStatus).toBeNull();
    await context.setOffline(true);
    await page.getByRole("button", { name: "Scan next pass", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Unable to check this pass", exact: true }),
    ).toBeVisible();
    expect(
      await db`select id from scan_events where invitation_id=${invitation} and admitted_people > 0`,
    ).toHaveLength(1);
    await context.unroute("**/api/checkin/guest-snapshot");
    await context.setOffline(false);
    await page.reload();
    const signOut = page.getByRole("button", { name: "Sign out", exact: true });
    await signOut.focus();
    await signOut.press("Enter");
    await expect(page).toHaveURL(/\/staff$/);
    expect(
      await page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("wedding-scanner-guests-v1");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<unknown>((resolve, reject) => {
            const request = db.transaction("snapshot").objectStore("snapshot").get("current");
            request.onsuccess = () => resolve(request.result?.snapshot ?? null);
            request.onerror = () => reject(request.error);
          });
        } finally {
          db.close();
        }
      }),
    ).toBeNull();
  } finally {
    // Retain synthetic admission evidence under the same append-only guards as
    // the real flow; revoke the disposable actor instead of deleting history.
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db.end();
  }
});
