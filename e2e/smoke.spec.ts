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

      // Fixed status meanings render with text labels and the theme's status tokens (TICKET-010).
      const statuses = section.getByTestId("status-swatches");
      for (const [kind, label] of [
        ["success", "Valid"],
        ["warning", "Already used"],
        ["danger", "Invalid"],
      ] as const) {
        const item = statuses.locator(`[data-status="${kind}"]`);
        await expect(item.getByText(label, { exact: true })).toBeVisible();
        // The panel paints exactly this theme's `<kind>-subtle` token.
        const panelColour = await item.evaluate((el) => getComputedStyle(el).backgroundColor);
        const hex = theme.colors[`${kind}-subtle`];
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
        expect(panelColour).toBe(`rgb(${r}, ${g}, ${b})`);
      }

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
