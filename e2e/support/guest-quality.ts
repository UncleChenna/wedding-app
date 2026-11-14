import type { BrowserContext, Page } from "@playwright/test";

export type GuestQualityIssue = {
  route: string;
  kind: "console.error" | "pageerror" | "layout-shift" | "unsupported";
  value?: number;
  sources?: {
    tag: string;
    before: { x: number; y: number; width: number; height: number };
    after: { x: number; y: number; width: number; height: number };
  }[];
};

export function guestRoute(path: string): string | null {
  if (["/", "/invite", "/order", "/lost-link", "/offline"].includes(path)) return path;
  if (path.startsWith("/i/")) return "/i/:invitation";
  if (path.startsWith("/p/")) return "/p/:pass";
  return null;
}

export async function watchGuestQuality(context: BrowserContext) {
  const issues: GuestQualityIssue[] = [];
  const pages = new Set<Page>();
  const routeOf = (page: Page) => {
    try {
      return guestRoute(new URL(page.url()).pathname);
    } catch {
      return null;
    }
  };
  const watch = (page: Page) => {
    if (pages.has(page)) return;
    pages.add(page);
    page.on("console", (message) => {
      const route = routeOf(page);
      if (route && message.type() === "error") issues.push({ route, kind: "console.error" });
    });
    page.on("pageerror", () => {
      const route = routeOf(page);
      if (route) issues.push({ route, kind: "pageerror" });
    });
  };
  context.on("page", watch);
  for (const page of context.pages()) watch(page);
  await context.exposeBinding("__reportGuestQuality", (_source, issue: GuestQualityIssue) => {
    // The init script emits only route labels, numeric shifts, layout rectangles, element tags and static categories.
    // Never retain console text, guest names, URLs, request bodies or pass tokens.
    issues.push(issue);
  });
  await context.addInitScript(() => {
    const state = window as unknown as {
      __reportGuestQuality: (issue: GuestQualityIssue) => Promise<void>;
      __flushGuestQuality: () => Promise<void>;
    };
    const route = () => {
      const path = location.pathname;
      if (["/", "/invite", "/order", "/lost-link", "/offline"].includes(path)) return path;
      if (path.startsWith("/i/")) return "/i/:invitation";
      if (path.startsWith("/p/")) return "/p/:pass";
      return null;
    };
    const pending: Promise<void>[] = [];
    const emit = (
      kind: "layout-shift" | "unsupported",
      value?: number,
      sources?: GuestQualityIssue["sources"],
    ) => {
      const current = route();
      if (current)
        pending.push(
          state.__reportGuestQuality({
            route: current,
            kind,
            value,
            ...(sources ? { sources } : {}),
          }),
        );
    };
    if (!PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      emit("unsupported");
      state.__flushGuestQuality = async () => {
        await Promise.all(pending);
      };
      return;
    }
    const collect = (entries: PerformanceEntry[]) => {
      for (const entry of entries) {
        const shift = entry as PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
          sources: { node?: Node; previousRect: DOMRectReadOnly; currentRect: DOMRectReadOnly }[];
        };
        if (!shift.hadRecentInput && shift.value > 0) {
          const rect = ({ x, y, width, height }: DOMRectReadOnly) => ({ x, y, width, height });
          emit(
            "layout-shift",
            shift.value,
            shift.sources.map((source) => ({
              tag:
                source.node instanceof Element
                  ? source.node.tagName
                  : (source.node?.parentElement?.tagName ?? "unknown"),
              before: rect(source.previousRect),
              after: rect(source.currentRect),
            })),
          );
        }
      }
    };
    const observer = new PerformanceObserver((list) => collect(list.getEntries()));
    observer.observe({ type: "layout-shift", buffered: true });
    state.__flushGuestQuality = async () => {
      collect(observer.takeRecords());
      await Promise.all(pending);
    };
    addEventListener("pagehide", () => {
      collect(observer.takeRecords());
    });
  });
  return {
    issues,
    async flush() {
      for (const page of pages) {
        if (page.isClosed() || !routeOf(page)) continue;
        await page.evaluate(async () => {
          await document.fonts.ready;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const state = window as unknown as { __flushGuestQuality?: () => Promise<void> };
          if (!state.__flushGuestQuality)
            throw new Error("Guest quality observer was not installed");
          await state.__flushGuestQuality();
        });
      }
    },
  };
}
