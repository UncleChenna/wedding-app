import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { themes } from "../src/modules/theming/themes";
import { applyTheme } from "./support/theme";

test("share menu @smoke copies the link and restores keyboard focus", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as Window & { copied?: string }).copied = value;
        },
      },
    });
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
  });
  await page.goto("/dev/share");
  const trigger = page.getByRole("button", { name: "Share invitation", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "More ways to share" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toContainText(
    "Link copied",
  );
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => (window as Window & { copied?: string }).copied)).toBe(
    "https://example.com/i/sample-invitation",
  );
});

test("share menu @smoke offers manual selection when copying is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
    document.execCommand = () => false;
  });
  await page.goto("/dev/share");
  await page.getByRole("button", { name: "Share invitation", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  const field = page.getByRole("textbox", { name: "Invitation link", exact: true });
  await expect(field).toBeVisible();
  await expect(field).toBeFocused();
  expect(await field.evaluate((element: HTMLInputElement) => element.selectionEnd)).toBe(
    "https://example.com/i/sample-invitation".length,
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("share menu @smoke falls back after clipboard permission denial", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    });
    document.execCommand = (command) => command === "copy";
  });
  await page.goto("/dev/share");
  await page.getByRole("button", { name: "Share invitation", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toContainText(
    "Link copied",
  );
});

for (const outcome of ["success", "cancel", "failure"] as const) {
  test(`share menu @smoke native share ${outcome}`, async ({ page }) => {
    await page.addInitScript((result) => {
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: ShareData) => {
          (window as Window & { shared?: ShareData }).shared = data;
          if (result === "cancel") throw new DOMException("Cancelled", "AbortError");
          if (result === "failure") throw new DOMException("Denied", "NotAllowedError");
        },
      });
    }, outcome);
    await page.goto("/dev/share");
    await page.getByRole("button", { name: "Share invitation", exact: true }).click();
    await page.getByRole("button", { name: "More ways to share" }).click();
    expect(await page.evaluate(() => (window as Window & { shared?: ShareData }).shared?.url)).toBe(
      "https://example.com/i/sample-invitation",
    );
    if (outcome === "success") {
      await expect(page.getByRole("dialog")).not.toBeVisible();
    } else {
      await expect(page.getByRole("dialog")).toBeVisible();
      if (outcome === "failure")
        await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Choose another");
      else await expect(page.getByRole("dialog").getByRole("alert")).toHaveCount(0);
    }
  });
}

for (const theme of themes) {
  for (const width of [375, 768, 1280]) {
    test(`share menu @smoke ${theme.id} ${width}: accessible sheet and encoded links`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/dev/share");
      await applyTheme(page, theme);
      await page.getByRole("button", { name: "Share invitation", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const whatsapp = new URL(
        (await dialog.getByRole("link", { name: "WhatsApp", exact: true }).getAttribute("href")) ??
          "",
      );
      expect(whatsapp.pathname).toBe("/447700900123");
      expect(whatsapp.searchParams.get("text")).toContain(
        "https://example.com/i/sample-invitation",
      );
      expect(
        await dialog.getByRole("link", { name: "Email", exact: true }).getAttribute("href"),
      ).toContain("mailto:guest%40example.com?");
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const sizes = await dialog.locator("button, a").evaluateAll((elements) =>
        elements.map((element) => ({
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        })),
      );
      expect(sizes.every((size) => size.width >= 44 && size.height >= 44)).toBe(true);
      await dialog.getByRole("button", { name: "Close", exact: true }).focus();
      await page.keyboard.press("Shift+Tab");
      await expect(dialog.getByRole("button", { name: "Copy link", exact: true })).toBeFocused();
      if (process.env.CAPTURE_SHARE_SCREENSHOTS === "1") {
        await page.screenshot({
          path: `docs/reviews/TICKET-050/${theme.id}-${width}-sheet.png`,
          fullPage: true,
        });
      }
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Share invitation", exact: true }),
      ).toBeFocused();
    });
  }
}

test("share menu @smoke writes the real browser clipboard", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/dev/share");
  await page.getByRole("button", { name: "Share invitation", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "https://example.com/i/sample-invitation",
  );
});

test("share menu @smoke hides native sharing when its payload is unsupported", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: async () => {} });
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
  });
  await page.goto("/dev/share");
  await page.getByRole("button", { name: "Share invitation", exact: true }).click();
  await expect(page.getByRole("button", { name: "More ways to share" })).toHaveCount(0);
});

test("share menu @smoke manual fallback remains usable in a short viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 568 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new Error("Denied");
        },
      },
    });
    document.execCommand = () => {
      throw new Error("Unavailable");
    };
  });
  await page.goto("/dev/share");
  await page.getByRole("button", { name: "Share invitation", exact: true }).click();
  await page.getByRole("button", { name: "Copy link", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Invitation link", exact: true }),
  ).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Share invitation", exact: true })).toBeFocused();
});

test("share menu @smoke preview loads without layout shifts", async ({ page }) => {
  await page.addInitScript(() => {
    (window as Window & { shareCls?: number }).shareCls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!entry.hadRecentInput) {
          const state = window as Window & { shareCls?: number };
          state.shareCls = (state.shareCls ?? 0) + entry.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/dev/share");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState("networkidle");
  expect(await page.evaluate(() => (window as Window & { shareCls?: number }).shareCls)).toBe(0);
});
