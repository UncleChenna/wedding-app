import { mkdirSync } from "node:fs";
import postgres, { type Sql } from "postgres";
import { expect, test } from "@playwright/test";
import { assertDatabaseTarget } from "../scripts/database-target";
import { signInAdmin } from "./support/admin-session";
import { getTheme, listThemes } from "../src/modules/theming";
import { scanA11y } from "./support/axe";
import { applyTheme } from "./support/theme";

test.describe("theme studio", () => {
  test.skip(
    process.env.RUN_THEME_EDITOR !== "1",
    "Requires isolated local Auth; use scripts/test-theme-editor.ts",
  );
  test.setTimeout(240_000);
  let db: Sql;
  let selection: { active_theme_id: string; active_dark_theme_id: string } | undefined;
  let active: { id: string; is_active: boolean }[] = [];
  let safe = false;
  test.beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    db = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    const existing = await db`select id from themes where id in ('wedding-light','wedding-dark')`;
    expect(existing).toHaveLength(0);
    [selection] =
      await db`select active_theme_id, active_dark_theme_id from event_settings where id=1`;
    active = await db`select id,is_active from themes`;
    safe = true;
  });
  test.afterAll(async () => {
    if (!db) return;
    try {
      if (safe)
        await db.begin(async (tx) => {
          if (selection)
            await tx`update event_settings set active_theme_id=${selection.active_theme_id}, active_dark_theme_id=${selection.active_dark_theme_id} where id=1`;
          else await tx`delete from event_settings where id=1`;
          await tx`delete from themes where id in ('wedding-light','wedding-dark')`;
          for (const row of active)
            await tx`update themes set is_active=${row.is_active} where id=${row.id}`;
        });
    } finally {
      await db.end();
    }
  });
  test("two-step admin previews, rejects, saves and publishes both appearances", async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    for (const route of ["/admin/themes"]) {
      const response = await request.get(route);
      expect(response.url()).toContain("/admin/sign-in");
    }
    const email = process.env.ADMIN_TEST_EMAIL;
    if (!email) throw new Error("Use scripts/test-theme-editor.ts");
    await signInAdmin(page, request, email);
    await page.getByRole("link", { name: "Themes", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Theme studio", exact: true })).toBeVisible();
    await page.getByText("Colours", { exact: true }).click();
    const light = getTheme("blush-sage");
    await page.getByLabel("Start from a preset").selectOption(light.id);
    await page.getByLabel("foreground hex", { exact: true }).fill(light.colors.background);
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("main").getByRole("alert").last()).toContainText("foreground");
    await expect(page.getByRole("button", { name: "Activate themes" })).toBeDisabled();
    expect(await db`select id from themes where id='wedding-light'`).toHaveLength(0);
    const frame = page.getByRole("region", { name: "Draft page preview" });
    await expect(frame.getByRole("heading", { name: /Uchenna/ })).toBeVisible();
    await expect(frame.locator('a[href^="/dev"]')).toHaveCount(0);
    await page.getByLabel("foreground hex", { exact: true }).fill(light.colors.foreground);
    await page.getByLabel("Theme name").fill("Our light draft");
    await page.getByLabel("Heading font").focus();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByLabel("Heading font")).toHaveValue("playfair");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Body font")).toBeFocused();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("main").getByRole("status").last()).toContainText("Draft saved");
    const [draft] = await db`select published_tokens from themes where id='wedding-light'`;
    expect(draft?.published_tokens).toBeNull();
    await page.getByLabel("Appearance", { exact: true }).selectOption("dark");
    await page.getByLabel("Start from a preset").selectOption("emerald-night");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByRole("main").getByRole("status").last()).toContainText("Draft saved");
    await page.reload();
    await expect(page.getByLabel("Theme name")).toHaveValue("Our light draft");
    await expect(page.getByLabel("Heading font")).toHaveValue("playfair");
    await page.getByLabel("Preview page").scrollIntoViewIfNeeded();
    await page.getByLabel("Preview page").focus();
    await expect(page.getByLabel("Preview page")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByLabel("Preview page")).toHaveValue("order");
    await expect(page.getByLabel("Preview page")).toBeFocused();
    await expect(frame.getByRole("heading", { name: "Where are you sitting?" })).toBeVisible();
    await frame.getByLabel("Table number").fill("1");
    await frame.getByRole("button", { name: "Browse menu" }).click();
    await expect(
      frame.getByRole("heading", { name: "Hungry? Thirsty? Say the word." }),
    ).toBeFocused();
    const otherEditor = await page.context().newPage();
    try {
      await otherEditor.goto("/admin/themes");
      await otherEditor.getByLabel("Theme name").fill("Another administrator's draft");
      await otherEditor.getByRole("button", { name: "Save draft", exact: true }).click();
      await expect(otherEditor.getByRole("main").getByRole("status").last()).toContainText(
        "Draft saved",
      );
      await page.getByRole("button", { name: "Activate themes" }).click();
      await expect(page.getByRole("main").getByRole("alert").last()).toContainText(
        "changed in another editor",
      );
      const [unpublished] = await db`select published_tokens from themes where id='wedding-light'`;
      expect(unpublished?.published_tokens).toBeNull();
    } finally {
      await otherEditor.close();
    }
    await page.reload();
    await expect(page.getByLabel("Theme name")).toHaveValue("Another administrator's draft");
    await page.getByRole("button", { name: "Activate themes" }).click();
    await expect(page.getByRole("main").getByRole("status").last()).toContainText(
      "Your themes are live",
    );
    for (const [scheme, theme] of [
      ["light", light],
      ["dark", getTheme("emerald-night")],
    ] as const) {
      const guest = await browser.newContext({
        baseURL,
        javaScriptEnabled: false,
        colorScheme: scheme,
      });
      try {
        const tab = await guest.newPage();
        await tab.goto("/order");
        expect(
          await tab
            .locator("html")
            .evaluate((element) =>
              getComputedStyle(element).getPropertyValue("--t-color-background").trim(),
            ),
        ).toBe(theme.colors.background);
      } finally {
        await guest.close();
      }
    }
    mkdirSync("docs/reviews/TICKET-098/screenshots", { recursive: true });
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const theme of listThemes()) {
      await applyTheme(page, theme);
      await page.getByLabel("Appearance", { exact: true }).selectOption(theme.colorScheme);
      await page.getByLabel("Start from a preset").selectOption(theme.id);
      for (const preview of ["invitation", "order"]) {
        await page.getByLabel("Preview page").selectOption(preview);
        for (const width of [375, 768, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await expect(page.locator("body")).toHaveJSProperty("scrollWidth", width);
          expect(await scanA11y(page)).toEqual([]);
          if (preview === "invitation") {
            const photo = await frame.getByRole("img").boundingBox();
            const names = await frame.getByRole("heading", { name: /Uchenna/ }).boundingBox();
            expect(photo).not.toBeNull();
            expect(names).not.toBeNull();
            expect(names?.y).toBeGreaterThan((photo?.y ?? 0) + (photo?.height ?? 0));
          }
          await page.screenshot({
            path: `docs/reviews/TICKET-098/screenshots/${theme.id}-${preview}-${width}.png`,
            fullPage: true,
          });
        }
      }
    }
  });
});
