import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

/** WCAG 2.0, 2.1 and 2.2 at levels A and AA: the project baseline (design principles §11). */
export const WCAG_AA_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

interface Violation {
  id: string;
  impact?: string | null;
  nodes: { target: unknown }[];
}

/**
 * Every WCAG A/AA violation fails the gate, whatever axe's impact rating: a "moderate"
 * AA failure is still an AA failure. Returned as readable lines for the assertion diff.
 */
export function describeViolations(violations: readonly Violation[]): string[] {
  return violations.map(
    (v) =>
      `${v.id} (${v.impact ?? "unknown"}): ${v.nodes.map((n) => JSON.stringify(n.target)).join(", ")}`,
  );
}

/**
 * Wait for finite animations to finish: mid-fade text has partial opacity and would be
 * measured wrongly. Infinite ones (a loading spinner) never finish, so they are skipped.
 */
export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
}

/** Scan the settled page for WCAG A/AA violations; an empty list means it passed. */
export async function scanA11y(page: Page): Promise<string[]> {
  await settleAnimations(page);
  const results = await new AxeBuilder({ page }).withTags(WCAG_AA_TAGS).analyze();
  return describeViolations(results.violations);
}
