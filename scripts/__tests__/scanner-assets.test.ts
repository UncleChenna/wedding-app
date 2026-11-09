import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generateScannerAssets } from "../scanner-assets";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "wedding-scanner-assets-"));
  roots.push(root);
  const browser = join(root, "src/modules/checkin/browser");
  await mkdir(browser, { recursive: true });
  await mkdir(join(root, "src/app"), { recursive: true });
  await cp("src/app/globals.css", join(root, "src/app/globals.css"));
  await cp("src/modules/theming/fonts", join(root, "src/modules/theming/fonts"), {
    recursive: true,
  });
  await cp(
    "src/modules/theming/font-fallbacks.css",
    join(root, "src/modules/theming/font-fallbacks.css"),
  );
  await writeFile(
    join(browser, "decoder.ts"),
    'export const decode = () => "PIXEL_DECODER_INCLUDED";',
  );
  await writeFile(
    join(browser, "scanner-shell-entry.tsx"),
    'document.body.className = "bg-primary md:flex type-staff"; void import("./decoder").then(m => document.body.dataset.decoder = m.decode());',
  );
  return { root, browser };
}
describe("prebuild offline scanner assets", () => {
  it("creates a complete deterministic manifest with embedded decoder and shared style/font assets", async () => {
    const { root } = await fixture();
    const manifest = await generateScannerAssets(root);
    const manifestPath = join(root, "public/scanner-assets/manifest.json");
    expect(JSON.parse(await readFile(manifestPath, "utf8"))).toEqual(manifest);
    expect(manifest.assets).toEqual([manifest.script, manifest.stylesheet, ...manifest.fonts]);
    for (const path of manifest.assets) {
      const bytes = await readFile(join(root, "public", path));
      expect(path).toContain(createHash("sha256").update(bytes).digest("hex"));
    }
    const js = await readFile(join(root, "public", manifest.script), "utf8");
    expect(js).toContain("PIXEL_DECODER_INCLUDED");
    expect(js).not.toMatch(/import\(/);
    const css = await readFile(join(root, "public", manifest.stylesheet), "utf8");
    expect(css).toContain(".bg-primary");
    expect(css).toContain(".md\\:flex");
    expect(css).toContain(".type-staff");
    expect(css).toContain("Cormorant Metric Fallback");
    expect(css).toContain("font-display: swap");
    for (const font of manifest.fonts) expect(css).toContain(font);
    expect(await generateScannerAssets(root)).toEqual(manifest);
  });
  it("changes the content-addressed build when decoder code changes", async () => {
    const { root, browser } = await fixture();
    const before = await generateScannerAssets(root);
    await writeFile(join(browser, "decoder.ts"), 'export const decode = () => "NEW_DECODER";');
    const after = await generateScannerAssets(root);
    expect(after.script).not.toBe(before.script);
    expect(after.build).not.toBe(before.build);
    expect(after.stylesheet).toBe(before.stylesheet);
  });
  it("refuses server-module imports and never publishes a manifest for them", async () => {
    const { root, browser } = await fixture();
    await mkdir(join(root, "src/modules/checkin/server"));
    await writeFile(
      join(root, "src/modules/checkin/server/private.ts"),
      'export const secret = "PRIVATE";',
    );
    await writeFile(
      join(browser, "scanner-shell-entry.tsx"),
      'import { secret } from "../server/private"; document.title = secret;',
    );
    await expect(generateScannerAssets(root)).rejects.toThrow(/server module/i);
    await expect(readFile(join(root, "public/scanner-assets/manifest.json"))).rejects.toThrow();
  });
});
