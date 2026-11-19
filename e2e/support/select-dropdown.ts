import { expect, type Locator } from "@playwright/test";

/** Exercise the same custom menu used by pointer/keyboard users. */
export async function selectDropdown(
  control: Locator,
  choice: string | { label: string } | { value: string },
) {
  await expect(control).toHaveJSProperty("tagName", "BUTTON");
  await control.click();
  const listId = await control.getAttribute("aria-controls");
  if (!listId) throw new Error("Dropdown has no listbox");
  const list = control.page().locator(`[id=${JSON.stringify(listId)}]`);
  await expect(list).toBeVisible();
  const options = list.getByRole("option");
  if (typeof choice !== "string" && "label" in choice) {
    await options
      .filter({
        hasText: new RegExp(`^${choice.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*✓?$`),
      })
      .click();
  } else {
    const value = typeof choice === "string" ? choice : choice.value;
    await list.locator(`[role="option"][data-value=${JSON.stringify(value)}]`).click();
  }
  await expect(control).toHaveAttribute("aria-expanded", "false");
}
