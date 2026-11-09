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
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { encodeGatePassPayload } from "../src/modules/checkin/lib/gate-token";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";

test.use({ trace: "off", screenshot: "off", video: "off" });
test("online partial admission commits once and safely retries a lost receipt", async ({
  page,
  context,
  baseURL,
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
    await db`insert into rsvps(invitation_id,attending,count_attending,message) values(${invitation},true,4,'PRIVATE RSVP MARKER')`;
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
    await page.emulateMedia({ reducedMotion: "reduce" });
    const denied = await context.request.post("/api/checkin/read", {
      data: { qr: `${baseURL}/p/${token}` },
    });
    expect(denied.status()).toBe(403);
    expect(await denied.json()).toEqual({ error: "Sign-in required." });
    await page.goto("/checkin");
    await page.getByLabel("Your six-digit PIN").fill(pin);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Open camera" })).toBeInViewport();
    await page.getByRole("button", { name: "Open camera" }).click();
    const valid = page.getByRole("heading", { name: "Valid pass", exact: true });
    try {
      await expect(valid).toBeVisible();
    } catch (error) {
      try {
        const folder = info.outputPath("synthetic-decode-diagnostics");
        mkdirSync(folder, { recursive: true });
        // Synthetic local-only pass; retained outside published review screenshots.
        writeFileSync(`${folder}/fixture.png`, Buffer.from(qr.split(",")[1] ?? "", "base64"));
        const captured = (await page.locator("video").count())
          ? await page.locator("video").evaluate((element) => {
              const video = element as HTMLVideoElement;
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const context = canvas.getContext("2d");
              const drawable =
                context && canvas.width > 0 && canvas.height > 0 && video.readyState >= 2;
              if (drawable) context.drawImage(video, 0, 0);
              return {
                frame: drawable ? canvas.toDataURL("image/png") : null,
                width: video.videoWidth,
                height: video.videoHeight,
                ready: video.readyState,
                paused: video.paused,
                time: video.currentTime,
                hidden: document.hidden,
                decodedFrames: video.getVideoPlaybackQuality().totalVideoFrames,
                nativeDetector: typeof (
                  globalThis as typeof globalThis & { BarcodeDetector?: unknown }
                ).BarcodeDetector,
                assets: performance
                  .getEntriesByType("resource")
                  .map((entry) => ({
                    name: new URL(entry.name).pathname,
                    duration: entry.duration,
                  }))
                  .filter(
                    (entry) =>
                      entry.name.startsWith("/_next/") ||
                      entry.name.startsWith("/scanner-assets/") ||
                      entry.name === "/api/checkin/read",
                  ),
              };
            })
          : { frame: null, videoAbsent: true };
        const { frame, ...details } = captured;
        if (frame)
          writeFileSync(
            `${folder}/video-frame.png`,
            Buffer.from(frame.split(",")[1] ?? "", "base64"),
          );
        writeFileSync(`${folder}/video.json`, JSON.stringify(details, null, 2));
      } catch {
        // Diagnostic failure must never replace the original assertion failure.
      }
      throw error;
    }
    await expect(page.getByText(`Table ${number}`, { exact: true })).toBeInViewport();
    await expect(valid).toBeInViewport();
    await expect(page.getByText("Synthetic Guest", { exact: true })).toBeInViewport();
    await expect(page.getByText(/No admission has been recorded/)).toBeVisible();
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(0);
    expect(await page.content()).not.toMatch(/PRIVATE DIETARY MARKER|PRIVATE RSVP MARKER/);
    const folder = `docs/reviews/TICKET-061/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    async function capture(state: string) {
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
            path: `${folder}/${state}-${theme.id}-${width}.png`,
            fullPage: true,
          });
        }
      }
      await page.setViewportSize({ width: 375, height: 812 });
    }
    await expect(page.getByLabel("How many are here?")).toHaveValue("4");
    await page.getByRole("button", { name: "One fewer guest" }).click();
    await page.getByRole("button", { name: "One fewer guest" }).click();
    await capture("choose-count");
    await page.getByRole("button", { name: "Admit 2 guests", exact: true }).focus();
    await page.getByRole("button", { name: "Admit 2 guests", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Admission recorded" })).toBeVisible();
    await expect(
      page
        .locator('[tabindex="-1"]')
        .filter({
          has: page.getByRole("heading", { name: "Admission recorded" }),
        })
        .last(),
    ).toBeFocused();
    await expect(page.getByText("2 guests admitted", { exact: true })).toBeVisible();
    expect(
      (
        await db`select admitted_people from admission_counters where invitation_id=${invitation}`
      )[0]?.admitted_people,
    ).toBe(2);
    await capture("recorded");
    await page.getByRole("button", { name: "Scan next pass" }).click();
    await expect(page.getByLabel("How many are here?")).toHaveValue("2");
    // The server commits; the browser loses only its response. Retrying must
    // use exactly the original intent, not create a second admission.
    let original: unknown;
    let attempts = 0;
    await page.route("**/api/checkin/admit", async (route) => {
      attempts++;
      const input: unknown = route.request().postDataJSON();
      if (attempts === 1) {
        original = input;
        const committed = await route.fetch();
        expect((await committed.json()).state).toBe("recorded");
        await page.evaluate(() => {
          Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
          document.dispatchEvent(new Event("visibilitychange"));
        });
        await route.abort("failed");
      } else {
        expect(input).toEqual(original);
        await route.continue();
      }
    });
    await page.getByRole("button", { name: "One fewer guest" }).click();
    await page.getByRole("button", { name: "Admit 1 guest", exact: true }).click();
    await expect(page.getByRole("button", { name: "Retry this admission" })).toBeVisible();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(page.getByRole("button", { name: "Scan next pass" })).toBeDisabled();
    await expect(page.getByLabel("How many are here?")).toBeDisabled();
    await capture("uncertain");
    await page.getByRole("button", { name: "Retry this admission" }).click();
    await expect(page.getByRole("heading", { name: "Already recorded" })).toBeVisible();
    await expect(
      page
        .locator('[tabindex="-1"]')
        .filter({
          has: page.getByRole("heading", { name: "Already recorded" }),
        })
        .last(),
    ).toBeFocused();
    await expect(page.getByText(/Do not admit them again/)).toBeVisible();
    await expect(page.getByText(/Welcome,/)).toHaveCount(0);
    expect(attempts).toBe(2);
    expect(
      (
        await db`select admitted_people from admission_counters where invitation_id=${invitation}`
      )[0]?.admitted_people,
    ).toBe(3);
    expect(await db`select id from scan_events where invitation_id=${invitation}`).toHaveLength(2);
    await capture("duplicate");
    await page.unroute("**/api/checkin/admit");
    await page.getByRole("button", { name: "Scan next pass" }).click();
    await expect(page.getByLabel("How many are here?")).toHaveValue("1");
    // A competing scanner uses the last place after this read. The old form
    // cannot grant entry, even though it previously showed one place.
    await db`insert into scan_events(client_event_id,invitation_id,staff_id,device_id,reported_at,reported_result,result,reported_people,admitted_people,source) values(${randomUUID()},${invitation},${staff},${device},now(),'valid','valid',1,1,'online')`;
    await page.getByRole("button", { name: "Admit 1 guest", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Please check" })).toBeVisible();
    await expect(page.getByText(/All places have already been admitted/)).toBeVisible();
    await expect(page.getByText(/Welcome,/)).toHaveCount(0);
    expect(
      (
        await db`select admitted_people from admission_counters where invitation_id=${invitation}`
      )[0]?.admitted_people,
    ).toBe(4);
    await capture("refused");
    // A previously checked pass can be revoked before the explicit admission.
    await db`update rsvps set count_attending=5 where invitation_id=${invitation}`;
    await page.getByRole("button", { name: "Scan next pass" }).click();
    await expect(page.getByLabel("How many are here?")).toHaveValue("1");
    await db`update invitations set status='revoked' where id=${invitation}`;
    await page.getByRole("button", { name: "Admit 1 guest", exact: true }).click();
    await expect(page.getByText(/This pass has been revoked or replaced/)).toBeVisible();
    await expect(page.getByText("Not admitted", { exact: true })).toHaveClass(/bg-danger/);
    expect(
      (
        await db`select admitted_people from admission_counters where invitation_id=${invitation}`
      )[0]?.admitted_people,
    ).toBe(4);
    await capture("revoked");
  } finally {
    // Preserve immutable synthetic evidence in the isolated database.
    await db`delete from event_settings where id=1 and venue=${venue}`;
    await db`update staff set revoked_at=now() where id=${staff}`;
    await db.end();
  }
});
