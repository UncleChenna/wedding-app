import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import QRCode from "qrcode";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { themes } from "../src/modules/theming/themes";
function credential(pin: string) {
  const salt = randomBytes(32);
  return `scrypt$32768$8$1$${salt.toString("hex")}$${scryptSync(pin, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString("hex")}`;
}
test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("gate scanner route", () => {
  test.skip(process.env.RUN_SCANNER_JOURNEY !== "1", "Requires isolated synthetic staff database");
  test.setTimeout(120_000);
  let db: Sql;
  const gateId = randomUUID();
  const barId = randomUUID();
  const venue = `scanner-${randomUUID()}`;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    await db`insert into event_settings(id,venue,event_date,time_zone) values(1,${venue},'2099-12-19','Etc/UTC')`;
    await db`insert into staff(id,name,role,pin_hash,pin_issued_at,pin_expires_at) values
      (${gateId},'Synthetic gate','gate',${credential("012345")},now() - interval '1 minute','2099-12-20T06:00:00Z'),
      (${barId},'Synthetic bar','bar',${credential("654321")},now() - interval '1 minute','2099-12-20T06:00:00Z')`;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      await db`delete from registered_devices where registered_by_staff_id in (${gateId},${barId})`;
      await db`delete from staff where id in (${gateId},${barId})`;
      await db`delete from event_settings where id=1 and venue=${venue}`;
    } finally {
      await db.end();
    }
  });
  test("requires gate sign-in, recovers permission, reads pixels and stops cleanly", async ({
    page,
    context,
  }, info) => {
    await page.setViewportSize({ width: info.project.name === "mobile" ? 375 : 1280, height: 900 });
    const qr = await QRCode.toDataURL("synthetic-route-qr", { width: 512, margin: 4 });
    await page.addInitScript(() => {
      const state = window as unknown as { scannerCls: number };
      state.scannerCls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!shift.hadRecentInput) state.scannerCls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.addInitScript((src) => {
      const state = window as unknown as {
        scannerFixture: { denied: boolean; tracks: MediaStreamTrack[] };
      };
      state.scannerFixture = { denied: true, tracks: [] };
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: {
          getUserMedia: async () => {
            if (state.scannerFixture.denied)
              throw new DOMException("Fixture permission denied", "NotAllowedError");
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 512;
            const draw = canvas.getContext("2d");
            if (!draw) throw new Error("Missing canvas");
            const image = new Image();
            image.src = src;
            await image.decode();
            draw.drawImage(image, 0, 0);
            const stream = canvas.captureStream(15);
            const timer = setInterval(() => draw.drawImage(image, 0, 0), 100);
            for (const track of stream.getTracks()) {
              const original = track.stop.bind(track);
              track.stop = () => {
                clearInterval(timer);
                original();
              };
            }
            state.scannerFixture.tracks = stream.getTracks();
            return stream;
          },
        },
      });
    }, qr);
    await page.goto("/checkin");
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open camera" })).toHaveCount(0);
    await page.getByLabel("Your six-digit PIN").fill("012345");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const open = page.getByRole("button", { name: "Open camera" });
    await expect(open).toBeVisible();
    await page.reload();
    await expect(open).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(() => (window as unknown as { scannerCls: number }).scannerCls),
    ).toBe(0);
    const targets = await page.locator("button, a").evaluateAll((elements) =>
      elements
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
        })
        .map((element) => element.textContent),
    );
    expect(targets).toEqual([]);
    const folder = `docs/reviews/TICKET-059/${info.project.name}`;
    mkdirSync(folder, { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      if (theme.id === "ivory-gold")
        await page.screenshot({ path: `${folder}/ready.png`, fullPage: true });
    }
    await open.focus();
    await open.press("Enter");
    await expect(page.getByText(/Allow camera access/)).toBeVisible();
    await page.getByRole("link", { name: "Manual check-in help" }).click();
    await expect(page.locator("#manual-check-in-help")).toBeFocused();
    for (const theme of themes) {
      await applyTheme(page, theme);
      expect(await scanA11y(page)).toEqual([]);
      if (theme.id === "ivory-gold")
        await page.screenshot({ path: `${folder}/denied.png`, fullPage: true });
    }
    await page.evaluate(() => {
      (window as unknown as { scannerFixture: { denied: boolean } }).scannerFixture.denied = false;
    });
    await page.getByRole("button", { name: "Retry camera" }).click();
    await expect(page.getByText("QR read", { exact: true })).toBeVisible();
    expect(await page.content()).not.toContain("synthetic-route-qr");
    await expect(page.getByText(/before admitting anyone/)).toBeVisible();
    await page.getByRole("button", { name: "Pause camera" }).click();
    expect(
      await page.evaluate(() =>
        (
          window as unknown as { scannerFixture: { tracks: MediaStreamTrack[] } }
        ).scannerFixture.tracks.every((track) => track.readyState === "ended"),
      ),
    ).toBe(true);
    for (const width of [375, 600, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await db`update staff set credential_version=credential_version+1 where id=${gateId}`;
    await page.reload();
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open camera" })).toHaveCount(0);
    await context.clearCookies();
    await page.goto("/bar");
    await page.getByLabel("Your six-digit PIN").fill("654321");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByText("You’re signed in.", { exact: true })).toBeVisible();
    await page.goto("/checkin");
    await expect(page.getByRole("button", { name: "Open camera" })).toHaveCount(0);
    await expect(page.getByLabel("Your six-digit PIN")).toBeVisible();
  });
});
