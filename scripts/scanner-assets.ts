import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { compile } from "tailwindcss";

export interface ScannerAssetManifest {
  version: 1;
  build: string;
  script: string;
  stylesheet: string;
  fonts: string[];
  assets: string[];
}
const require = createRequire(import.meta.url);
const digest = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const faces = [
  {
    key: "cormorant",
    file: "cormorant.woff2",
    weight: "400 600",
    style: "normal",
    fallback: "Cormorant",
  },
  {
    key: "cormorant",
    file: "cormorant-italic.woff2",
    weight: "400 600",
    style: "italic",
    fallback: "Cormorant",
  },
  {
    key: "playfair",
    file: "playfair.woff2",
    weight: "400 900",
    style: "normal",
    fallback: "Playfair",
  },
  { key: "inter", file: "inter.woff2", weight: "100 900", style: "normal", fallback: "Inter" },
  { key: "jost", file: "jost.woff2", weight: "100 900", style: "normal", fallback: "Jost" },
] as const;

/** Finalize immutable assets BEFORE Next traces or deployment adapters copy them. */
export async function generateScannerAssets(root: string): Promise<ScannerAssetManifest> {
  const result = await build({
    absWorkingDir: root,
    entryPoints: ["src/modules/checkin/browser/scanner-shell-entry.tsx"],
    bundle: true,
    splitting: false,
    platform: "browser",
    format: "iife",
    target: "es2022",
    define: { "process.env.NODE_ENV": '"production"' },
    minify: true,
    write: false,
    metafile: true,
  });
  if (
    result.outputFiles.length !== 1 ||
    Object.values(result.metafile.outputs).some((output) => output.imports.length)
  )
    throw new Error("Scanner bundle must contain every decoder import and emit one script");
  const inputs = Object.keys(result.metafile.inputs);
  if (inputs.some((path) => /(?:^|\/)server(?:\/|\.)|(?:^|\/)server-only(?:\/|$)/.test(path)))
    throw new Error("Scanner browser bundle contains a server module");
  const scriptBytes = result.outputFiles[0]?.contents;
  if (!scriptBytes) throw new Error("Scanner script missing");
  const candidates = new Set<string>();
  for (const path of inputs.filter((path) => path.startsWith("src/") && /\.[jt]sx?$/.test(path))) {
    const source = await readFile(join(root, path), "utf8");
    // Conservative literal candidates: the same static utility strings used by shared components.
    // Dynamic class assembly is not supported; browser styling checks prove the shipped surface.
    for (const candidate of source.match(/[^\s"'`<>]+/g) ?? []) candidates.add(candidate);
  }
  const globals = join(root, "src/app/globals.css");
  const compiler = await compile(await readFile(globals, "utf8"), {
    base: dirname(globals),
    loadStylesheet: async (id, base) => {
      if (id !== "tailwindcss" && !id.startsWith("."))
        throw new Error("Unsupported scanner stylesheet import");
      const path =
        id === "tailwindcss" ? require.resolve("tailwindcss/index.css") : resolve(base, id);
      return { path, base: dirname(path), content: await readFile(path, "utf8") };
    },
  });
  const files = new Map<string, Uint8Array>();
  const script = `/scanner-assets/scanner-${digest(scriptBytes)}.js`;
  files.set(script, scriptBytes);
  const fonts: string[] = [];
  const fontCss: string[] = [
    await readFile(join(root, "src/modules/theming/font-fallbacks.css"), "utf8"),
  ];
  for (const face of faces) {
    const bytes = await readFile(join(root, "src/modules/theming/fonts", face.file));
    const path = `/scanner-assets/scanner-${digest(bytes)}.woff2`;
    files.set(path, bytes);
    fonts.push(path);
    fontCss.push(
      `@font-face { font-family: "Scanner ${face.key}"; src: url("${path}") format("woff2"); font-weight: ${face.weight}; font-style: ${face.style}; font-display: swap; }`,
    );
    if (face.style === "normal")
      fontCss.push(
        `:root { --font-${face.key}: "Scanner ${face.key}", "${face.fallback} Metric Fallback"; }`,
      );
  }
  const css = compiler.build([...candidates].sort()) + "\n" + fontCss.join("\n");
  const stylesheet = `/scanner-assets/scanner-${digest(css)}.css`;
  files.set(stylesheet, Buffer.from(css));
  const inventory = { script, stylesheet, fonts };
  const manifest: ScannerAssetManifest = {
    version: 1,
    build: digest(JSON.stringify(inventory)),
    ...inventory,
    assets: [script, stylesheet, ...fonts],
  };
  const output = join(root, "public/scanner-assets");
  await mkdir(output, { recursive: true });
  for (const [path, bytes] of files) await writeFile(join(root, "public", path), bytes);
  // No incomplete manifest is visible if compilation, font reads or asset writes fail.
  const temporary = join(output, "manifest.json.tmp");
  await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n");
  await rename(temporary, join(output, "manifest.json"));
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await generateScannerAssets(process.cwd());
  process.stdout.write(
    `Prepared scanner build ${manifest.build} with ${manifest.assets.length} immutable assets\n`,
  );
}
