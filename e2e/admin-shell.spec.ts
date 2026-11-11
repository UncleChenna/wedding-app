import { mkdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";
import { scanA11y } from "./support/axe";

// The real shell sits behind admin sign-in (Supabase Auth); /dev/admin renders the same shell with sample content.
test.describe("admin shell", () => {
  test("keyboard reaches every section and sign-out with visible focus @smoke", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dev/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    const links = nav.getByRole("link");
    const sections = [
      "Control room",
      "Guests",
      "Invitation requests",
      "Sharing",
      "Menu",
      "Staff",
      "Scan log",
      "Settings",
    ];
    await expect(links).toHaveText(sections);
    // On phones sign-out sits in the header, away from the section bar.
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sign out", exact: true }),
    ).toBeVisible();
    await expect(nav.getByRole("link", { name: "Control room" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const reached: string[] = [];
    for (let i = 0; i < 20 && reached.length < sections.length; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement) || !el.closest('nav[aria-label="Admin"]')) return null;
        const style = getComputedStyle(el);
        return {
          text: el.textContent,
          outline: style.outlineStyle,
          width: parseFloat(style.outlineWidth),
        };
      });
      if (focused) {
        expect(focused.outline).not.toBe("none");
        expect(focused.width).toBeGreaterThan(0);
        reached.push(focused.text ?? "");
      }
    }
    expect(reached).toEqual(sections);
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    // Without a session the section route sends the browser to sign-in.
    await expect(page).toHaveURL(/\/admin\/sign-in$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("bottom bar on phones, sidebar on desktop, in every theme", async ({ page }) => {
    await page.goto("/dev/admin");
    const nav = page.getByRole("navigation", { name: "Admin" });
    for (const theme of themes)
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        for (const link of await nav.getByRole("link").all()) {
          const box = await link.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
          expect(box?.width).toBeGreaterThanOrEqual(44);
        }
        const box = await nav.boundingBox();
        if (width < 768) {
          // Thumb reach: the bar is pinned to the bottom edge of the viewport.
          expect(Math.round((box?.y ?? 0) + (box?.height ?? 0))).toBe(900);
          // Scrolling to the end leaves the last content above the bar, not underneath it.
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
          const last = await page.getByRole("heading", { name: "Settings" }).boundingBox();
          const bar = await nav.boundingBox();
          expect((last?.y ?? 0) + (last?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
          await page.evaluate(() => window.scrollTo(0, 0));
        } else {
          expect(box?.x).toBe(0);
          expect(box?.width).toBeLessThan(width / 2);
        }
        const dir =
          (process.env.ADMIN_SHELL_SCREENSHOT_DIR ?? "docs/reviews/TICKET-088") + "/" + theme.id;
        mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: dir + "/" + width + ".png" });
      }
  });
});
