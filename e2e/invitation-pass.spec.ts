import { removeInvitationFixtures } from "./support/local-fixtures";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("issued invitation pass", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(
    process.env.RUN_PASS_BROWSER_TESTS !== "1",
    "Requires isolated database and ephemeral signing keys",
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
      throw new Error("Refusing to replace existing event settings");
    await db`insert into event_settings(id,time_zone,venue) values(1,'Etc/UTC','RSVP browser test only') on conflict(id) do nothing`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        await removeInvitationFixtures(db, ids);
      } finally {
        await db.end();
      }
    }
  });
  async function fixture() {
    const token = randomBytes(32).toString("base64url");
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},'Pass review household','sent') returning id`;
    if (!row) throw new Error("Fixture missing");
    ids.push(row.id);
    await db`insert into guests(invitation_id,name,is_primary) values(${row.id},'Ada Example',true)`;
    return { id: row.id, token };
  }
  test("yes immediately shows signed pass; returning and changed replies stay correct", async ({
    browser,
    baseURL,
  }) => {
    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      const guest = await fixture();
      const context = await browser.newContext({
        baseURL,
        viewport: { width: 375, height: 812 },
        reducedMotion,
      });
      try {
        const page = await context.newPage();
        await page.goto("/i/" + guest.token);
        await expect(page.getByRole("img", { name: /Entry pass QR/ })).toHaveCount(0);
        await page.getByRole("button", { name: "Count me in", exact: true }).click();
        await expect(
          page.getByRole("img", { name: "Entry pass QR code for Ada Example" }),
        ).toBeVisible();
        const href = await page
          .getByRole("link", { name: "Open your pass", exact: true })
          .getAttribute("href");
        expect(href).toContain("/p/");
        expect(href).not.toContain(guest.token);
        const pass = new URL(href ?? "").pathname;
        const response = await page.request.get(pass);
        expect(response.status()).toBe(200);
        expect(await response.text()).toContain("Ada Example");
        expect(response.headers()["cache-control"]).toContain("no-store");
        await page.reload();
        await expect(page.locator("[data-envelope]")).toHaveAttribute("data-opening", "false");
        await page.getByRole("link", { name: "Your pass", exact: true }).click();
        await expect(page.locator("#pass")).toBeInViewport();
        for (const theme of themes)
          for (const width of [375, 768, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            await applyTheme(page, theme);
            expect(await scanA11y(page)).toEqual([]);
            expect(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            ).toBe(true);
            const qr = page.getByRole("img", { name: "Entry pass QR code for Ada Example" });
            const moduleSize = await qr.evaluate(
              (el) =>
                el.getBoundingClientRect().width /
                Number(el.getAttribute("viewBox")?.split(" ")[2]),
            );
            expect(moduleSize).toBeGreaterThanOrEqual(3);
            if (reducedMotion === "reduce") {
              const directory =
                (process.env.PASS_REVIEW_DIR ?? "docs/reviews/TICKET-044") + "/" + theme.id;
              mkdirSync(directory, { recursive: true });
              await page
                .locator("#pass")
                .screenshot({ path: directory + "/" + width + "-pass.png" });
              await page.screenshot({
                path: directory + "/" + width + "-invitation.png",
                fullPage: true,
              });
            }
          }
        await page.getByRole("button", { name: "I'll be there in spirit", exact: true }).click();
        await expect(page.getByRole("img", { name: /Entry pass QR/ })).toHaveCount(0);
        const declined = await page.request.get(pass);
        expect(await declined.text()).not.toContain("Gate pass QR code for");
        await db`update invitations set status='revoked' where id=${guest.id}`;
        expect((await page.request.get("/i/" + guest.token)).status()).toBe(404);
      } finally {
        await context.close();
      }
    }
  });
});
