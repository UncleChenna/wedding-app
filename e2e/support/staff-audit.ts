import { mkdirSync, writeFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import { scanA11y } from "./axe";
import { applyTheme } from "./theme";
import { themes } from "../../src/modules/theming/themes";
const results: unknown[] = [];
export async function auditStaffScreen(page: Page, name: string, staff = false) {
  const folder = "docs/reviews/TICKET-118";
  mkdirSync(folder, { recursive: true });
  for (const theme of themes) {
    await applyTheme(page, theme);
    await page.evaluate(() => document.fonts.ready);
    const violations = await scanA11y(page);
    const geometry = await page.evaluate(() => {
      const small: { text: string; px: number }[] = [];
      const root =
        document.querySelector("dialog[open]") ??
        Array.from(document.querySelectorAll("main")).find(
          (element) => element.getBoundingClientRect().width > 0,
        );
      if (!root) throw new Error("Audit requires the rendered main landmark");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode,
          element = node.parentElement;
        if (
          !element ||
          !node.textContent?.trim() ||
          element.closest('[aria-hidden="true"],.sr-only,script,style')
        )
          continue;
        const bounds = element.getBoundingClientRect();
        if (!bounds.width || !bounds.height || getComputedStyle(element).visibility === "hidden")
          continue;
        const px = parseFloat(getComputedStyle(element).fontSize);
        if (px < 18) small.push({ text: node.textContent.trim().slice(0, 80), px });
      }
      for (const control of root.querySelectorAll<HTMLInputElement>(
        "input:not([type=hidden]),select,textarea",
      )) {
        const bounds = control.getBoundingClientRect();
        if (!bounds.width || !bounds.height || ["checkbox", "radio"].includes(control.type))
          continue;
        const px = parseFloat(getComputedStyle(control).fontSize);
        if (px < 18)
          small.push({
            text: control.getAttribute("aria-label") ?? control.id ?? control.tagName,
            px,
          });
      }
      const identifiers = Array.from(root.querySelectorAll<HTMLElement>("h2,h3,p"))
        .filter((element) =>
          /^(Table \d+|Valid pass|Already used|Invalid pass|Revoked pass|Not RSVP’d)$/.test(
            element.textContent?.trim() ?? "",
          ),
        )
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => ({
          text: element.textContent,
          px: parseFloat(getComputedStyle(element).fontSize),
        }));
      return { overflow: document.documentElement.scrollWidth > innerWidth, small, identifiers };
    });
    results.push({ name, theme: theme.id, violations, ...geometry });
    writeFileSync(`${folder}/results.json`, JSON.stringify(results, null, 2) + "\n");
    writeFileSync(
      `${folder}/${name}-${theme.id}.json`,
      JSON.stringify({ name, theme: theme.id, violations, ...geometry }, null, 2) + "\n",
    );
    if (theme === themes[0])
      await page.screenshot({
        path: `${folder}/${name}.png`,
        fullPage: !name.endsWith("new-order"),
      });
    expect.soft(violations, `${name}/${theme.id}`).toEqual([]);
    if (staff)
      expect
        .soft(
          geometry.identifiers.filter((item) => item.px < 32),
          `${name}/${theme.id} identifiers`,
        )
        .toEqual([]);
    expect.soft(geometry.overflow, `${name}/${theme.id} overflow`).toBe(false);
    expect
      .soft(geometry.small, `${name}/${theme.id} ${staff ? "staff" : "admin"} typography`)
      .toEqual([]);
  }
}
