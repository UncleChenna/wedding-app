import { test, expect } from "./fixtures";

// These are deliberate failing invocations, not normal CI scenarios. Run each with
// RUN_GUEST_QUALITY_PROOF=all|console|pageerror|shift and verify the guard's exact failure.
for (const fault of ["console", "pageerror", "shift"] as const)
  test(`quality guard rejects an injected ${fault} after navigation`, async ({ page, context }) => {
    test.skip(
      ![fault, "all"].includes(process.env.RUN_GUEST_QUALITY_PROOF ?? ""),
      "Explicit negative proof only",
    );
    await context.route("**/invite", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><title>Quality proof</title><main><div id="spacer"></div><h1>Proof fixture</h1><p>A visible paragraph anchors layout shift.</p></main>',
      }),
    );
    await context.route("**/order", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Clean destination</title><h1>Clean destination</h1>",
      }),
    );
    const popup = await context.newPage();
    await popup.goto("/invite");
    await popup.bringToFront();
    await expect(popup.getByRole("heading", { name: "Proof fixture" })).toBeVisible();
    const measured = await popup.evaluate(async (kind) => {
      const shifts: { value: number; recent: boolean }[] = [];
      const proofObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          shifts.push({ value: shift.value, recent: shift.hadRecentInput });
        }
      });
      proofObserver.observe({ type: "layout-shift", buffered: true });
      // Exclude the browser’s recent-input grace period: this must be genuine CLS.
      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      if (kind === "console") console.error("Deliberate quality proof");
      if (kind === "pageerror")
        setTimeout(() => {
          throw new Error("Deliberate quality proof");
        }, 0);
      if (kind === "shift") {
        const spacer = document.getElementById("spacer");
        if (!spacer) throw new Error("Proof fixture missing spacer");
        spacer.style.height = "100px";
      }
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
      await (
        window as unknown as { __flushGuestQuality: () => Promise<void> }
      ).__flushGuestQuality();
      proofObserver.disconnect();
      return shifts;
    }, fault);
    if (fault === "shift")
      expect(measured.some((entry) => entry.value > 0 && !entry.recent)).toBe(true);
    await popup.goto("/order");
    await popup.close();
    await page.goto("/order");
    // The fixture still fails: navigating away and closing a tab must not erase history.
    await expect(page.getByRole("heading", { name: "Clean destination" })).toBeVisible();
  });
