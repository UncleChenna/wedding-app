import { expect, test } from "@playwright/test";

import { listThemes } from "../src/modules/theming";

test.describe("smoke @smoke", () => {
  test("home page renders in the active theme without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (msg) => msg.type() === "error" && errors.push(msg.text()));

    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", /.+/);
    const background = await html.evaluate((el) =>
      getComputedStyle(el).getPropertyValue("--t-color-background").trim(),
    );
    expect(background).toMatch(/^#[0-9a-f]{6}$/i);
    expect(errors).toEqual([]);
  });

  test("placeholder routes for each area respond", async ({ page }) => {
    for (const path of ["/invite", "/order", "/checkin", "/kitchen", "/admin"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("/dev/theme shows every component in every theme", async ({ page }) => {
    await page.goto("/dev/theme");
    for (const theme of listThemes()) {
      const section = page.getByTestId(`theme-${theme.id}`);
      await expect(section.getByRole("heading", { name: theme.name })).toBeVisible();
      await expect(section.getByRole("button", { name: "Primary" })).toBeVisible();
      await expect(section.getByLabel("Full name")).toBeVisible();
      await expect(section.getByText("RSVP saved")).toBeVisible();

      // Each section carries its own theme variables.
      const bg = await section.evaluate((el) =>
        getComputedStyle(el).getPropertyValue("--t-color-background").trim(),
      );
      expect(bg.toUpperCase()).toBe(theme.colors.background.toUpperCase());

      await section.getByRole("button", { name: "Open sheet" }).click();
      const sheet = page.getByRole("dialog", { name: "Your order" });
      await expect(sheet).toBeVisible();
      await sheet.getByRole("button", { name: "Close" }).click();
      await expect(sheet).toBeHidden();

      await section.getByRole("button", { name: "Show toast" }).click();
      await expect(section.getByRole("status")).toContainText("Order sent");
    }
  });

  test("unknown routes get the themed 404 page", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
  });

  test("security headers are set", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
