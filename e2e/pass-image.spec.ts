import { randomBytes, createPrivateKey, createPublicKey } from "node:crypto";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import jsQR from "jsqr";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { verifyGatePass } from "../src/modules/checkin/lib/gate-token";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

type Raster = { data: Buffer; info: { width: number; height: number } };
const sharp = createRequire(import.meta.resolve("next"))("sharp") as (bytes: Buffer) => {
  ensureAlpha(): { raw(): { toBuffer(options: { resolveWithObject: true }): Promise<Raster> } };
};
test.describe("pass image", () => {
  test.skip(
    process.env.RUN_PASS_IMAGE_TESTS !== "1",
    "Isolated database and ephemeral signing keys required",
  );
  let db: Sql;
  const ids: string[] = [];
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const existing = await db`select venue from event_settings where id=1`;
    if (existing.length && existing[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing non-test settings");
    await db`insert into event_settings(id,time_zone,venue) values(1,'Etc/UTC','RSVP browser test only') on conflict(id) do nothing`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
      } finally {
        await db.end();
      }
    }
  });
  test("download, signature, themes, sharing fallback and rejected capabilities", async ({
    page,
    browser,
    baseURL,
  }) => {
    const token = randomBytes(32).toString("base64url");
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},'Pass image review','rsvp_yes') returning id`;
    if (!row) throw new Error("Fixture missing");
    ids.push(row.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${row.id},'Adaora Image',true)`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${row.id},true,2)`;
    const path = "/i/" + token;
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: () => Promise.reject(new DOMException("Cancelled", "AbortError")),
      });
    });
    await page.goto(path);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save image", exact: true }).press("Enter");
    const saved = await download;
    expect(saved.suggestedFilename()).toBe("entry-pass.png");
    const file = await saved.path();
    if (!file) throw new Error("Missing download");
    const image = readFileSync(file);
    const pixels = await sharp(image).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(pixels.info.width).toBe(1080);
    const code = jsQR(new Uint8ClampedArray(pixels.data), pixels.info.width, pixels.info.height);
    if (!code) throw new Error("PNG did not decode");
    expect(code.data).not.toContain(token);
    const key = createPrivateKey({
      key: Buffer.from(process.env.GATE_SIGNING_PRIVATE_KEY ?? "", "base64url"),
      format: "der",
      type: "pkcs8",
    });
    const signed = new URL(code.data);
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
    if (!verified.ok) throw new Error("Invalid PNG signature");
    expect(verified.payload.inv).toBe(row.id);
    await expect(page.getByRole("status").filter({ hasText: "Your image is ready" })).toBeVisible();
    await page.getByRole("button", { name: "Share image", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Your image is ready" })).toBeVisible();
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        const button = page.getByRole("button", { name: "Save image", exact: true });
        await button.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Shift+Tab");
        await expect(button).toBeFocused();
        expect(
          await button.evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth)),
        ).toBeGreaterThan(0);
        expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
        const dir = "docs/reviews/TICKET-045/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.locator("#pass").screenshot({ path: dir + "/" + width + ".png" });
      }
    mkdirSync("docs/reviews/TICKET-045", { recursive: true });
    writeFileSync("docs/reviews/TICKET-045/download.png", image);
    for (const scheme of ["light", "dark"]) {
      const response = await page.request.get(path + "/pass.png?scheme=" + scheme);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("image/png");
      expect(response.headers()["cache-control"]).toContain("no-store");
      writeFileSync("docs/reviews/TICKET-045/" + scheme + ".png", await response.body());
    }
    await page.evaluate(() =>
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false }),
    );
    const fallbackDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Save image", exact: true }).click();
    await fallbackDownload;
    await expect(page.getByRole("button", { name: "Share image", exact: true })).toHaveCount(0);
    const longName = "Adaora " + "Longfamilyname".repeat(12);
    await db`update guests set name=${longName} where invitation_id=${row.id}`;
    const longResponse = await page.request.get(path + "/pass.png");
    expect(longResponse.status()).toBe(200);
    writeFileSync("docs/reviews/TICKET-045/long-name.png", await longResponse.body());
    await db`update guests set name=${"Guest \u{10FFFF}"} where invitation_id=${row.id}`;
    const unsupported = await page.request.get(path + "/pass.png");
    expect(unsupported.status()).toBe(503);
    expect(await unsupported.text()).toContain("screenshot");
    await db`update guests set name='Adaora Image' where invitation_id=${row.id}`;
    const noScript = await browser.newContext({ javaScriptEnabled: false, baseURL });
    try {
      const fallbackPage = await noScript.newPage();
      await fallbackPage.goto(path);
      const popupPromise = fallbackPage.waitForEvent("popup");
      await fallbackPage.getByRole("link", { name: "Open image", exact: true }).click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      expect(new URL(popup.url()).pathname).toBe(path + "/pass.png");
    } finally {
      await noScript.close();
    }
    const unknown = await page.request.get(
      "/i/" + randomBytes(32).toString("base64url") + "/pass.png",
    );
    expect(unknown.status()).toBe(404);
    for (const status of ["revoked", "rsvp_no", "sent"]) {
      await db`update invitations set status=${status} where id=${row.id}`;
      const response = await page.request.get(path + "/pass.png");
      expect(response.status()).toBe(404);
      expect(response.headers()["cache-control"]).toContain("no-store");
    }
    await page.getByRole("button", { name: "Save image", exact: true }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "We couldn't prepare your image" }),
    ).toBeVisible();
    const fallback = page.getByRole("link", { name: "Open image", exact: true });
    await expect(fallback).toHaveAttribute("target", "_blank");
    await expect(fallback).toHaveAttribute("rel", "noopener noreferrer");
  });
});
