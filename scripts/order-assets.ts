import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const digest = (data: Uint8Array | string) => createHash("sha256").update(data).digest("hex");
export async function generateOrderAssets(root: string, production = true) {
  const output = join(root, "public/order-assets");
  await mkdir(output, { recursive: true });
  async function emit(data: Uint8Array | string, extension: string) {
    const path = `/order-assets/order-${digest(data)}.${extension}`;
    await writeFile(join(root, "public", path), data);
    return path;
  }
  const bundle = await build({
    absWorkingDir: root,
    entryPoints: ["src/modules/ordering/browser/order-entry.ts"],
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2022",
    minify: true,
    write: false,
    metafile: true,
    define: { "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development") },
  });
  if (
    bundle.outputFiles.length !== 1 ||
    Object.keys(bundle.metafile.inputs).some((path) =>
      /(?:^|\/)server(?:\/|\.)|server-only/.test(path),
    )
  )
    throw new Error("Order bundle must be self-contained and public-only");
  const code = bundle.outputFiles[0]?.contents;
  if (!code) throw new Error("Order bundle missing");
  const script = await emit(code, "js");
  const subsets = JSON.parse(
    await readFile(join(root, "src/modules/ordering/fonts/manifest.json"), "utf8"),
  ) as { primaryRange: string; fallbackRange: string; igboRange: string };
  const fonts = [];
  const styles = [
    await readFile(join(root, "src/modules/theming/font-fallbacks.css"), "utf8"),
    await readFile(join(root, "src/modules/ordering/browser/order.css"), "utf8"),
  ];
  for (const [family, label, weight] of [
    ["cormorant", "Cormorant", "400 600"],
    ["inter", "Inter", "100 900"],
    ["playfair", "Playfair", "400 900"],
    ["jost", "Jost", "100 900"],
  ]) {
    for (const complete of [false, true]) {
      const bytes = await readFile(
        join(
          root,
          complete
            ? `src/modules/theming/fonts/${family}.woff2`
            : `src/modules/ordering/fonts/${family}.woff2`,
        ),
      );
      const path = await emit(bytes, "woff2");
      fonts.push(path);
      styles.push(
        `@font-face{font-family:"Order ${family}${complete ? " Complete" : ""}";src:url("${path}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap;${`unicode-range:${complete ? subsets.fallbackRange : subsets.primaryRange};`}}`,
      );
    }
    const igbo = await emit(
      await readFile(join(root, `src/modules/ordering/fonts/${family}-igbo.woff2`)),
      "woff2",
    );
    fonts.push(igbo);
    styles.push(
      `@font-face{font-family:"Order ${family}";src:url("${igbo}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap;unicode-range:${subsets.igboRange};}`,
    );
    styles.push(
      `:root{--font-${family}:"Order ${family}","Order ${family} Complete","${label} Metric Fallback"}`,
    );
  }
  const stylesheet = await emit(styles.join("\n"), "css");
  const manifest = { version: 1, script, stylesheet, fonts };
  const temporary = join(output, "manifest.json.tmp");
  await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n");
  await rename(temporary, join(output, "manifest.json"));
  return manifest;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await generateOrderAssets(process.cwd(), !process.argv.includes("--dev"));
  process.stdout.write(`Prepared order assets ${manifest.script}\n`);
}
