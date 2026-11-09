import { createHash } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseScannerAssets, readScannerAssets } from "../server/scanner-assets";

function manifest() {
  const inventory = {
    script: `/scanner-assets/scanner-${"a".repeat(64)}.js`,
    stylesheet: `/scanner-assets/scanner-${"b".repeat(64)}.css`,
    fonts: [`/scanner-assets/scanner-${"c".repeat(64)}.woff2`],
  };
  return {
    version: 1,
    build: createHash("sha256").update(JSON.stringify(inventory)).digest("hex"),
    ...inventory,
    assets: [inventory.script, inventory.stylesheet, ...inventory.fonts],
  };
}
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
describe("server scanner manifest", () => {
  it("accepts the complete hashed inventory", () => {
    const value = manifest();
    expect(parseScannerAssets(value)).toEqual(value);
  });
  it.each(["external", "traversal", "unhashed", "incomplete", "duplicate", "build", "extra"])(
    "rejects %s inventory",
    (kind) => {
      const value = manifest();
      const patch =
        kind === "external"
          ? { script: "https://elsewhere.example/scanner.js" }
          : kind === "traversal"
            ? { stylesheet: "/scanner-assets/../admin" }
            : kind === "unhashed"
              ? { script: "/scanner-assets/scanner.js" }
              : kind === "incomplete"
                ? { assets: [value.script] }
                : kind === "duplicate"
                  ? { fonts: [...value.fonts, ...value.fonts] }
                  : kind === "build"
                    ? { build: "d".repeat(64) }
                    : { private: "unexpected" };
      expect(parseScannerAssets({ ...value, ...patch })).toBeNull();
    },
  );
  it("reads the final file afresh and fails closed for missing or corrupt manifests", async () => {
    const root = await mkdtemp(join(tmpdir(), "scanner-manifest-"));
    roots.push(root);
    expect(await readScannerAssets(root)).toBeNull();
    const dir = join(root, "public/scanner-assets");
    await mkdir(dir, { recursive: true });
    const value = manifest();
    await writeFile(join(dir, "manifest.json"), JSON.stringify(value));
    expect(await readScannerAssets(root)).toEqual(value);
    await writeFile(join(dir, "manifest.json"), "not json");
    expect(await readScannerAssets(root)).toBeNull();
  });
});
