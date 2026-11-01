import { expect, type Page } from "@playwright/test";

/** Follow rendered same-origin links; do not visit every registry item and call that a crawl. */
export async function crawlRoutes(
  page: Page,
  entries: readonly string[],
  registered: readonly string[],
  dynamicPaths: ReadonlyMap<string, string> = new Map(),
  backLinks: ReadonlyMap<string, string> = new Map(),
): Promise<Set<string>> {
  const known = new Set(registered);
  const visited = new Set<string>();
  const queued = [...entries];
  const attempted = new Set<string>();
  const canonical = (path: string) => dynamicPaths.get(path) ?? path;
  while (queued.length) {
    const path = queued.shift();
    if (!path || attempted.has(path)) continue;
    attempted.add(path);
    const response = await page.goto(path);
    expect(response?.status(), canonical(path)).toBeLessThan(400);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const current = new URL(page.url());
    const key = canonical(current.pathname);
    if (known.has(key)) visited.add(key);
    const hub = backLinks.get(key);
    if (hub)
      await expect(
        page.locator(`a[href="${hub}"]`).first(),
        `Return link from ${key}`,
      ).toBeVisible();
    const links = await page
      .locator("a[href]")
      .evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
    for (const href of links) {
      const url = new URL(href, current);
      if (
        url.origin === current.origin &&
        known.has(canonical(url.pathname)) &&
        !attempted.has(url.pathname)
      ) {
        queued.push(url.pathname);
      }
    }
  }
  return visited;
}

export function requireReachableRoutes(
  registered: readonly string[],
  visited: ReadonlySet<string>,
) {
  const missing = registered.filter((path) => !visited.has(path));
  if (missing.length) throw new Error("Unreachable routes: " + missing.join(", "));
}
