import { test, expect } from "@playwright/test";
import { build } from "esbuild";
import { gateVerificationVectors } from "../../e2e/fixtures/gate-verification-vectors";
import type { verifyScannerToken } from "../../src/modules/checkin/lib/verify";

declare global {
  interface Window {
    GateVerifier: { verifyScannerToken: typeof verifyScannerToken };
  }
}

for (const fallback of [false, true]) {
  test(`gate credential vectors and public-only bundle, fallback=${fallback}`, async ({
    page,
    browser,
  }, testInfo) => {
    const bundled = await build({
      entryPoints: ["src/modules/checkin/lib/verify.ts"],
      bundle: true,
      platform: "browser",
      format: "iife",
      globalName: "GateVerifier",
      write: false,
      metafile: true,
      minify: true,
      target: "es2020",
    });
    const output = bundled.outputFiles[0];
    expect(output).toBeDefined();
    if (!output) throw new Error("Missing verifier bundle");
    const fixture = gateVerificationVectors();
    expect(
      Object.keys(bundled.metafile.inputs).filter((path) =>
        /\/server\/|node:crypto|signing\.ts/.test(path),
      ),
    ).toEqual([]);
    for (const forbidden of [
      fixture.privateMaterial,
      "GATE_SIGNING_PRIVATE_KEY",
      "BEGIN PRIVATE KEY",
    ])
      expect(output.text).not.toContain(forbidden);
    // A secure loopback origin permits native WebCrypto and CacheStorage, without an app/database.
    await page.route("http://localhost:32919/**", async (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Public credential verifier</title>",
      }),
    );
    await page.goto("http://localhost:32919/");
    if (fallback)
      await page.evaluate(() =>
        Object.defineProperty(window, "crypto", { value: undefined, configurable: true }),
      );
    await page.addScriptTag({ content: output.text });
    for (const vector of fixture.vectors) {
      const result = await page.evaluate(
        async ({ vector, keys }) =>
          window.GateVerifier.verifyScannerToken(vector.token, keys, vector),
        { vector, keys: fixture.keys },
      );
      expect(result, vector.label).toEqual(vector.expected);
    }
    const first = fixture.vectors.find((vector) => vector.label === "valid");
    if (!first) throw new Error("Missing valid vector");
    const timings = await page.evaluate(
      async ({ vector, keys }) => {
        const durations: number[] = [];
        for (let i = 0; i < 50; i++) {
          const start = performance.now();
          const result = await window.GateVerifier.verifyScannerToken(vector.token, keys, vector);
          if (!result.ok) throw new Error("Timing vector failed");
          durations.push(performance.now() - start);
        }
        return durations;
      },
      { vector: first, keys: fixture.keys },
    );
    const sorted = [...timings].sort((a, b) => a - b);
    await testInfo.attach("automated-token-timings.json", {
      body: JSON.stringify(
        {
          browser: browser.browserType().name(),
          version: browser.version(),
          fallback,
          mode: fallback ? "forced JavaScript fallback" : "default / native attempted",
          automatedTargetMs: 20,
          samples: timings,
          medianMs: sorted[25],
          p95Ms: sorted[47],
          maxMs: sorted[49],
          bundleBytes: output.contents.length,
          physicalDeviceCertified: false,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    // Verify the exact cacheable artifact, not just a source-code import rule.
    const cached = await page.evaluate(async (code) => {
      const cache = await caches.open("public-verifier-test");
      await cache.put("/verifier.js", new Response(code));
      return (await cache.match("/verifier.js"))?.text();
    }, output.text);
    expect(cached).toBe(output.text);
    expect(cached).not.toContain(fixture.privateMaterial);
    await page.evaluate(() => caches.delete("public-verifier-test"));
  });
}
