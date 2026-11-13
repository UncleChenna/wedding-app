import "server-only";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const schema = z
  .object({
    version: z.literal(1),
    build: z.string().regex(/^[a-f0-9]{64}$/),
    script: z.string().regex(/^\/scanner-assets\/scanner-[a-f0-9]{64}\.js$/),
    verifier: z
      .string()
      .regex(/^\/scanner-assets\/scanner-[a-f0-9]{64}\.js$/)
      .optional(),
    stylesheet: z.string().regex(/^\/scanner-assets\/scanner-[a-f0-9]{64}\.css$/),
    fonts: z
      .array(z.string().regex(/^\/scanner-assets\/scanner-[a-f0-9]{64}\.woff2$/))
      .min(1)
      .max(20),
    assets: z.array(z.string()).min(3).max(22),
  })
  .strict();
export type ScannerAssets = z.infer<typeof schema>;

export function parseScannerAssets(value: unknown): ScannerAssets | null {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return null;
  const manifest = parsed.data;
  const inventory = {
    script: manifest.script,
    stylesheet: manifest.stylesheet,
    fonts: manifest.fonts,
    ...(manifest.verifier ? { verifier: manifest.verifier } : {}),
  };
  const expected = [
    manifest.script,
    manifest.stylesheet,
    ...manifest.fonts,
    ...(manifest.verifier ? [manifest.verifier] : []),
  ];
  if (
    new Set(expected).size !== expected.length ||
    JSON.stringify(expected) !== JSON.stringify(manifest.assets)
  )
    return null;
  if (createHash("sha256").update(JSON.stringify(inventory)).digest("hex") !== manifest.build)
    return null;
  return manifest;
}

/** Read the finalized, traced build artifact; never retain a previous deployment's manifest. */
export async function readScannerAssets(root = process.cwd()): Promise<ScannerAssets | null> {
  try {
    const text = await readFile(join(root, "public/scanner-assets/manifest.json"), "utf8");
    if (text.length > 65_536) return null;
    const value: unknown = JSON.parse(text);
    return parseScannerAssets(value);
  } catch {
    // Development before generation, missing packaged files and invalid manifests all fail closed.
    return null;
  }
}
