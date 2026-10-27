import { mkdirSync } from "node:fs";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";
import { listThemes } from "../src/modules/theming";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import postgres, { type Sql } from "postgres";

const enabled = process.env.RUN_INVITATION_ROUTE_TESTS === "1";
const token = () => randomBytes(32).toString("base64url");
let db: Sql;
let valid: string;
let revoked: string;
let unknown: string;
let fixtureIds: string[] = [];

test.describe("personal invitation routes", () => {
  test.skip(!enabled, "Requires this worktree's isolated database and explicit opt-in");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
    const port = config
      .split("[db]\n")[1]
      ?.split("\n[")[0]
      ?.match(/^port\s*=\s*(\d+)$/m)?.[1];
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !port || url.port !== port)
      throw new Error("Route fixtures require this worktree's isolated database");
    db = postgres(url.toString(), { max: 1, connect_timeout: 10 });
    valid = token();
    revoked = token();
    unknown = token();
    await db.begin(async (tx) => {
      const rows = await tx<{ id: string; token: string }[]>`
        insert into invitations (token, household_name, status)
        values (${valid}, 'Route test household', 'sent'), (${revoked}, 'Hidden revoked household', 'revoked') returning id, token`;
      fixtureIds = rows.map((row) => row.id);
      const invitation = rows.find((row) => row.token === valid);
      if (!invitation) throw new Error("Fixture insert failed");
      await tx`insert into guests (invitation_id, name, is_primary) values (${invitation.id}, 'Amara Testguest', true)`;
    });
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (fixtureIds.length) await db`delete from invitations where id in ${db(fixtureIds)}`;
      } finally {
        await db.end();
      }
    }
    fixtureIds = [];
  });

  test("@smoke valid token renders the personal invitation without identifier links", async ({
    page,
  }) => {
    const response = await page.goto(`/i/${valid}`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()["cache-control"]).toContain("no-store");
    expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
    expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    expect(await page.title()).not.toContain("Amara");
    await expect(page.getByText("Amara Testguest", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Uchenna & Adaora" })).toBeVisible();
    for (const href of await page
      .locator("a")
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""))) {
      expect(fixtureIds.some((id) => href.includes(id))).toBe(false);
    }
  });

  test("@smoke unknown and revoked tokens return identical neutral HTTP 404 pages", async ({
    page,
  }) => {
    const missing = await page.goto(`/i/${unknown}`);
    expect(missing?.status()).toBe(404);
    const neutral = await page.locator("main").innerText();
    const denied = await page.goto(`/i/${revoked}`);
    expect(denied?.status()).toBe(404);
    expect(await page.locator("main").innerText()).toBe(neutral);
    await expect(page.getByText("Hidden revoked household")).toHaveCount(0);
  });

  test("@smoke an already visited invitation becomes unavailable after revocation", async ({
    page,
  }) => {
    await page.goto(`/i/${valid}`);
    await expect(page.getByText("Amara Testguest", { exact: true })).toBeVisible();
    await db`update invitations set status = 'revoked' where token = ${valid}`;
    const response = await page.reload();
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Amara Testguest", { exact: true })).toHaveCount(0);
    await db`update invitations set status = 'sent' where token = ${valid}`;
  });

  test("@smoke personal invitation and unavailable page remain accessible in each theme", async ({
    page,
  }) => {
    mkdirSync("artifacts/TICKET-036", { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of listThemes()) {
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        for (const [state, path] of [
          ["valid", `/i/${valid}`],
          ["unavailable", `/i/${unknown}`],
        ]) {
          if (!path) throw new Error("Missing route fixture");
          await page.goto(path);
          await applyTheme(page, theme);
          await page.evaluate(() => document.fonts.ready);
          expect(await scanA11y(page)).toEqual([]);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          ).toBe(true);
          // Start from a visible non-interactive element, not body's retained tab cursor.
          await page.getByRole("heading", { level: 1 }).click();
          await page.keyboard.press("Tab");
          await expect(
            page.getByRole("link", {
              name: state === "valid" ? "Back to our day" : "Back to home",
            }),
          ).toBeFocused();
          await page.screenshot({
            path: `artifacts/TICKET-036/${state}-${theme.id}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
  });
  test("@smoke personal invitation has stable layout and usable link targets", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/i/${valid}`);
    await expect(page.getByText("Amara Testguest", { exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBe(0);
    const target = await page.getByRole("link", { name: "Back to our day" }).boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);
  });
});
