import { readFileSync } from "node:fs";
import { waitForPublicDestination } from "./support/routes";
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
      await waitForPublicDestination(page, path);
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
      await expect(section.getByRole("status").filter({ hasText: "Order sent" })).toBeVisible();
    }
  });

  test("unknown routes get the themed 404 page", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "This page wandered off" })).toBeVisible();
    const links = page.getByRole("main").getByRole("link");
    await expect(links).toHaveCount(1);
    await expect(links).toHaveAttribute("href", "/");
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 812 });
      const offset = await page.getByRole("main").evaluate((main) => {
        const content = [...main.children].map((child) => child.getBoundingClientRect());
        const top = Math.min(...content.map((box) => box.top));
        const bottom = Math.max(...content.map((box) => box.bottom));
        return Math.abs((top + bottom) / 2 - innerHeight / 2);
      });
      expect(offset, `content centred at ${width}px`).toBeLessThanOrEqual(2);
    }
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

  test("CSP permits the required local worker, fonts and camera policy", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as { policyViolations: string[] };
      state.policyViolations = [];
      addEventListener("securitypolicyviolation", (event) => {
        state.policyViolations.push(
          `${event.effectiveDirective}:${event.blockedURI}:${new URL(event.sourceFile || location.href, location.href).pathname}`,
        );
      });
    });
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    const headers = response?.headers() ?? {};
    expect(headers["permissions-policy"]).toBe(
      "camera=(self), microphone=(), geolocation=(), payment=()",
    );
    expect(headers["content-security-policy"]).toContain("worker-src 'self' blob:");
    expect(headers["content-security-policy"]).toContain("font-src 'self'");
    expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
    expect(headers["strict-transport-security"]).toContain("max-age=63072000");

    const capabilities = await page.evaluate(async () => {
      await document.fonts.ready;
      const policy = (
        document as Document & {
          featurePolicy: { allowsFeature(name: string): boolean };
        }
      ).featurePolicy;
      const source = URL.createObjectURL(
        new Blob(["postMessage('worker-ready')"], { type: "text/javascript" }),
      );
      const worker = new Worker(source);
      const workerReady = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 5000);
        worker.onmessage = (event) => {
          clearTimeout(timeout);
          resolve(event.data === "worker-ready");
        };
        worker.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
      worker.terminate();
      URL.revokeObjectURL(source);
      return {
        workerReady,
        camera: policy.allowsFeature("camera"),
        microphone: policy.allowsFeature("microphone"),
        loadedFonts: [...document.fonts].filter((font) => font.status === "loaded").length,
      };
    });
    expect(capabilities.workerReady).toBe(true);
    expect(capabilities.camera).toBe(true);
    expect(capabilities.microphone).toBe(false);
    expect(capabilities.loadedFonts).toBeGreaterThan(0);
    await expect
      .poll(() =>
        page.evaluate(async () =>
          Boolean((await navigator.serviceWorker.getRegistration())?.active),
        ),
      )
      .toBe(true);
    const workerResponse = await page.request.get("/sw.js");
    expect(workerResponse.status()).toBe(200);
    expect(workerResponse.headers()["service-worker-allowed"]).toBe("/");
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(
        () => (window as unknown as { policyViolations: string[] }).policyViolations,
      ),
    ).toEqual([]);
  });

  test("standalone scanner initialization respects the delivered CSP", async ({ page }) => {
    const response = await page.request.get("/");
    expect(response.status()).toBe(200);
    const manifest = JSON.parse(readFileSync("public/scanner-assets/manifest.json", "utf8")) as {
      script: string;
    };
    expect(manifest.script).toMatch(/^\/scanner-assets\/[a-z0-9-]+\.js$/);
    await page.addInitScript(() => {
      const state = window as unknown as { policyViolations: string[] };
      state.policyViolations = [];
      addEventListener("securitypolicyviolation", (event) =>
        state.policyViolations.push(event.effectiveDirective),
      );
    });
    // Synthetic expired shell exercises the actual standalone bundle without
    // minting a staff session or claiming an authenticated/offline admission.
    await page.route("**/__scanner-csp-probe", (route) =>
      route.fulfill({
        status: 200,
        headers: {
          "content-type": "text/html",
          "content-security-policy":
            response.headers()["content-security-policy"] ?? "default-src 'none'",
        },
        body: `<!doctype html><html><body><div id="scanner-shell" data-expires-at="0" data-session="" data-build=""></div><script defer src="${manifest.script}"></script></body></html>`,
      }),
    );
    await page.goto("/__scanner-csp-probe");
    await expect(page.getByRole("heading", { name: "Gate check-in" })).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(
      await page.evaluate(
        () => (window as unknown as { policyViolations: string[] }).policyViolations,
      ),
    ).toEqual([]);
  });

  test("CSP blocks unauthorized script sources in the actual browser", async ({ page }) => {
    await page.goto("/");
    const violations = await page.evaluate(async () => {
      return new Promise<string[]>((resolve) => {
        const blocked: string[] = [];
        const timeout = setTimeout(() => {
          removeEventListener("securitypolicyviolation", onViolation);
          resolve(blocked);
        }, 5000);
        function onViolation(event: SecurityPolicyViolationEvent) {
          if (event.effectiveDirective !== "script-src-elem") return;
          blocked.push(event.blockedURI);
          if (blocked.length === 2) {
            clearTimeout(timeout);
            removeEventListener("securitypolicyviolation", onViolation);
            resolve(blocked);
          }
        }
        addEventListener("securitypolicyviolation", onViolation);
        for (const source of [
          "https://csp-probe.invalid/blocked.js",
          "data:text/javascript,window.__cspProbeExecuted%3Dtrue",
        ]) {
          const script = document.createElement("script");
          script.src = source;
          document.head.append(script);
        }
      });
    });
    expect(violations).toContain("https://csp-probe.invalid/blocked.js");
    expect(violations).toContain("data");
    expect(
      await page.evaluate(
        () => (window as unknown as { __cspProbeExecuted?: boolean }).__cspProbeExecuted,
      ),
    ).toBeUndefined();
  });
});
