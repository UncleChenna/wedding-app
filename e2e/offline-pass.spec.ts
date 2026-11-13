import { randomBytes, createPrivateKey, createPublicKey } from "node:crypto";
import jsQR from "jsqr";
import { verifyGatePass } from "../src/modules/checkin/lib/gate-token";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";
import { OWN_PASS_CACHE } from "../src/modules/invitations/lib/offline-worker";

test.describe("own offline pass", () => {
  test.skip(
    process.env.RUN_OFFLINE_PASS_TESTS !== "1",
    "Requires isolated fixtures and ephemeral signing keys",
  );
  let db: Sql;
  let createdSettings = false;
  const ids: string[] = [];
  async function fixture(name: string) {
    const token = randomBytes(32).toString("base64url");
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},${name},'rsvp_yes') returning id`;
    if (!row) throw new Error("Fixture missing");
    ids.push(row.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${row.id},${name},true)`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${row.id},true,1)`;
    return { id: row.id, path: "/i/" + token };
  }
  test.beforeAll(async () => {
    if (existsSync(".env.local")) process.loadEnvFile(".env.local");
    if (existsSync(".harness/worktree.json")) {
      const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
      expect(meta.path).toBe(process.cwd());
    } else if (process.env.CI !== "true" || process.env.GITHUB_ACTIONS !== "true") {
      throw new Error("Offline pass fixtures require a managed worktree or hosted CI checkout");
    }
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const settings = await db`select venue from event_settings where id=1`;
    if (settings.length && settings[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing non-test settings");
    const inserted =
      await db`insert into event_settings(id,time_zone,venue,event_date) values(1,'Etc/UTC','RSVP browser test only','2099-12-19') on conflict(id) do nothing returning id`;
    createdSettings = inserted.length === 1;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
        if (createdSettings)
          await db`delete from event_settings where id=1 and venue='RSVP browser test only'`;
      } finally {
        await db.end();
      }
    }
  });
  test("first view saves only this pass; offline reload, themes, eviction and reconnect revocation", async ({
    page,
    context,
  }, info) => {
    const a = await fixture("Ada Offline");
    const b = await fixture("Uche Private");
    await page.addInitScript(() => {
      const state = window as Window & { offlineCls?: number };
      state.offlineCls = 0;
      new PerformanceObserver((list) => {
        for (const item of list.getEntries()) {
          const entry = item as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!entry.hadRecentInput) state.offlineCls = (state.offlineCls ?? 0) + entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(a.path);
    await expect(page.getByRole("status").filter({ hasText: "Saved for offline" })).toBeVisible({
      timeout: 20000,
    });
    const savedHint = page.getByRole("status").filter({ hasText: "Saved for offline" });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await applyTheme(page, theme);
        await savedHint.scrollIntoViewIfNeeded();
        expect(await scanA11y(page)).toEqual([]);
        const dir =
          (process.env.OFFLINE_PASS_REVIEW_DIR ?? "docs/reviews/TICKET-107") +
          "/" +
          info.project.name +
          "/" +
          theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/online-" + width + ".png" });
      }
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Ada Offline" })).toBeVisible();
    await expect(page.getByText("This is your offline copy.", { exact: false })).toBeVisible();
    const refreshed = await page.locator("time").getAttribute("datetime");
    expect(refreshed).toMatch(/^20/);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    expect(await page.evaluate(() => (window as Window & { offlineCls?: number }).offlineCls)).toBe(
      0,
    );
    const svg = page.getByRole("img");
    const side = Number((await svg.getAttribute("viewBox"))?.split(" ")[2]);
    const path = (await svg.locator("path").getAttribute("d")) ?? "";
    const points = new Set(
      [...path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].map((match) => match[1] + "," + match[2]),
    );
    const width = side * 5;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (let y = 0; y < width; y++)
      for (let x = 0; x < width; x++) {
        if (points.has(Math.floor(x / 5) + "," + Math.floor(y / 5))) {
          const offset = (y * width + x) * 4;
          pixels[offset] = 0;
          pixels[offset + 1] = 0;
          pixels[offset + 2] = 0;
        }
      }
    const decoded = jsQR(pixels, width, width);
    if (!decoded) throw new Error("Saved SVG did not decode");
    const signed = new URL(decoded.data);
    expect(signed.pathname.startsWith("/p/")).toBe(true);
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      format: "der",
      type: "pkcs8",
    });
    const verified = await verifyGatePass(
      signed.pathname.slice(3),
      [
        {
          kid: process.env.GATE_SIGNING_KEY_ID ?? "",
          alg: "Ed25519",
          spki: createPublicKey(key).export({ format: "der", type: "spki" }).toString("base64url"),
        },
      ],
      { now: Date.now() },
    );
    if (!verified.ok) throw new Error("Saved signature failed: " + verified.reason);
    expect(verified.payload.inv).toBe(a.id);
    expect(verified.payload.ver).toBe(1);
    expect(await page.locator("form").count()).toBe(0);
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const button = page.getByRole("button", { name: "Refresh pass" });
        await button.focus();
        await expect(button).toBeFocused();
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        const dir =
          (process.env.OFFLINE_PASS_REVIEW_DIR ?? "docs/reviews/TICKET-107") +
          "/" +
          info.project.name +
          "/" +
          theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + ".png", fullPage: true });
      }
    await page.getByRole("button", { name: "Refresh pass" }).press("Enter");
    await expect(page.locator("time")).toHaveAttribute("datetime", refreshed ?? "");
    await page.goto(b.path);
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByText("Ada Offline", { exact: true })).toHaveCount(0);
    await page.goto(a.path);
    await expect(page.getByRole("heading", { name: "Ada Offline" })).toBeVisible();
    await db`update invitations set status='revoked' where id=${a.id}`;
    await context.setOffline(false);
    await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
    expect(
      await page.evaluate(
        async (name) => (await (await caches.open(name)).keys()).length,
        OWN_PASS_CACHE,
      ),
    ).toBe(0);
    await page.goto(b.path);
    await expect(page.getByRole("status").filter({ hasText: "Saved for offline" })).toBeVisible();
    await db`update invitations set status='rsvp_no' where id=${b.id}`;
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(
      page.getByRole("img", { name: "Entry pass QR code for Uche Private" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        async (name) => (await (await caches.open(name)).keys()).length,
        OWN_PASS_CACHE,
      ),
    ).toBe(0);
    const c = await fixture("Ezinne Eviction");
    await page.goto(c.path);
    await expect(page.getByRole("status").filter({ hasText: "Saved for offline" })).toBeVisible();
    await page.evaluate((name) => caches.delete(name), OWN_PASS_CACHE);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "You're offline" })).toBeVisible();
    await expect(page.getByText("Ezinne Eviction", { exact: true })).toHaveCount(0);
  });
});
