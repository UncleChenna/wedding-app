import { waitForPublicDestination } from "./support/routes";
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { expect, test } from "@playwright/test";

import { listThemes } from "../src/modules/theming";
import { describeViolations, scanA11y } from "./support/axe";
import { ALL_ROUTES, PAGE_ROUTES } from "./support/routes";
import { applyTheme } from "./support/theme";

/**
 * WCAG A/AA on every route in every theme, on every PR (TICKET-115). Any violation fails,
 * whatever its axe impact. Criteria axe cannot judge are covered by manual audits
 * (TICKET-117, TICKET-118).
 */
test.describe("accessibility on every route @smoke", () => {
  for (const theme of listThemes()) {
    for (const route of ALL_ROUTES) {
      test(`${route} in ${theme.id} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(route);
        await waitForPublicDestination(page, route);
        await applyTheme(page, theme);
        expect(await scanA11y(page)).toEqual([]);
      });
    }
  }
});

test.describe("accessibility gate @smoke", () => {
  test("the route list covers every page in src/app", () => {
    const appDir = join(process.cwd(), "src", "app");
    const pages = (readdirSync(appDir, { recursive: true }) as string[])
      .filter((file) => file.endsWith(`${sep}page.tsx`) || file === "page.tsx")
      .map((file) => {
        const segments = relative(".", file)
          .split(sep)
          .slice(0, -1)
          .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
        return `/${segments.join("/")}`;
      });
    const missing = pages.filter((page) => {
      const pattern = new RegExp(`^${page.replace(/\[[^\]]+\]/g, "[^/]+")}$`);
      return !PAGE_ROUTES.some((route) => pattern.test(route));
    });
    expect(missing, "add these pages to e2e/support/routes.ts").toEqual([]);
  });

  test("an injected violation fails the scan", async ({ page }) => {
    await page.setContent(
      `<html lang="en"><body><main><h1>Broken on purpose</h1>
        <img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">
        <label>Name</label><input type="text">
      </main></body></html>`,
    );
    const violations = await scanA11y(page);
    expect(violations.some((v) => v.startsWith("image-alt"))).toBe(true);
    expect(violations.some((v) => v.startsWith("label"))).toBe(true);
  });

  test("moderate and minor violations are not filtered out", () => {
    const lines = describeViolations([
      { id: "some-aa-rule", impact: "moderate", nodes: [{ target: ["#a"] }] },
      { id: "another-aa-rule", impact: "minor", nodes: [{ target: ["#b"] }] },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("moderate");
  });
});
