import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { test, expect } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

test.describe("printable invitation", () => {
  test.skip(
    process.env.RUN_PDF_BROWSER_TESTS !== "1",
    "Requires isolated synthetic data and ephemeral keys",
  );
  let db: Sql;
  let id: string;
  const token = randomBytes(32).toString("base64url");
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const meta = JSON.parse(readFileSync(".harness/worktree.json", "utf8")) as { path: string };
    expect(meta.path).toBe(process.cwd());
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 2 });
    const settings = await db`select venue from event_settings where id=1`;
    if (settings.length && settings[0]?.venue !== "RSVP browser test only")
      throw new Error("Refusing non-review settings");
    await db`insert into event_settings(id,time_zone,venue) values(1,'Etc/UTC','RSVP browser test only') on conflict(id) do nothing`;
    const [row] = await db<
      { id: string }[]
    >`insert into invitations(token,household_name,status) values(${token},'PDF review','rsvp_yes') returning id`;
    if (!row) throw new Error("Fixture missing");
    id = row.id;
    await db`insert into guests(invitation_id,name,is_primary) values(${id},'Ada Example',true)`;
    await db`insert into rsvps(invitation_id,attending,count_attending) values(${id},true,1)`;
  });
  test.afterAll(async () => {
    if (db) {
      try {
        if (id) await db`delete from invitations where id=${id}`;
      } finally {
        await db.end();
      }
    }
  });
  test("downloads a private PDF and keeps the link usable in every theme", async ({ page }) => {
    await page.goto("/i/" + token);
    for (const theme of themes) {
      await page.emulateMedia({ colorScheme: theme.colorScheme, reducedMotion: "reduce" });
      await applyTheme(page, theme);
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        const link = page.getByRole("link", { name: "Download invitation PDF" });
        await expect(link).toHaveCount(1);
        await link.focus();
        await expect(link).toBeFocused();
        const bounds = await link.boundingBox();
        expect(bounds?.height).toBeGreaterThanOrEqual(44);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(await scanA11y(page)).toEqual([]);
        const directory = "docs/reviews/TICKET-046/" + theme.id;
        mkdirSync(directory, { recursive: true });
        await page.locator("#pass").screenshot({ path: directory + "/" + width + ".png" });
      }
    }
    const link = page.getByRole("link", { name: "Download invitation PDF" });
    const downloadPromise = page.waitForEvent("download");
    await link.press("Enter");
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("wedding-invitation.pdf");
    await download.saveAs("artifacts/TICKET-046/browser-download.pdf");
    for (const scheme of ["light", "dark"]) {
      const response = await page.request.get("/i/" + token + "/invitation.pdf?scheme=" + scheme);
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers()["content-type"]).toBe("application/pdf");
      const pdf = (await response.body()).toString("latin1");
      expect(pdf).toContain(scheme === "light" ? "ivory-gold" : "midnight-champagne");
      expect(pdf).not.toContain(token);
    }
    await db`update invitations set status='rsvp_no' where id=${id}`;
    expect((await page.request.get("/i/" + token + "/invitation.pdf")).status()).toBe(404);
    await db`update invitations set status='revoked' where id=${id}`;
    expect((await page.request.get("/i/" + token + "/invitation.pdf")).status()).toBe(404);
    expect((await page.request.get("/i/bad/invitation.pdf")).status()).toBe(404);
  });
});
