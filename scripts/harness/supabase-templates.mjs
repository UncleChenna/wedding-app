import { copyFileSync, lstatSync, mkdirSync, readdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

function inside(root, path) {
  const rel = relative(root, path);
  if (!rel || rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) {
    throw new Error("Template setup must be inside the checkout");
  }
  return rel;
}

function inspect(root, path) {
  const rel = inside(root, path);
  let current = root;
  for (const part of rel.split(sep)) {
    current = join(current, part);
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error("Supabase template symlink rejected: " + current);
    if (stat && current !== path && !stat.isDirectory())
      throw new Error("Template parent is not a directory");
  }
  return lstatSync(path, { throwIfNoEntry: false });
}

// Preflight the entire tree before copying; never follow links or remove unrelated files.
export function copySupabaseTemplates(checkout, setup) {
  const lexicalRoot = resolve(checkout);
  const setupRelative = inside(lexicalRoot, resolve(setup));
  const root = realpathSync(lexicalRoot);
  const source = join(root, "supabase", "templates");
  const destination = join(root, setupRelative, "supabase", "templates");
  const entries = [];
  function visit(from, to) {
    const stat = inspect(root, from);
    const target = inspect(root, to);
    if (!stat) return;
    if (stat.isDirectory()) {
      if (target && !target.isDirectory())
        throw new Error("Template destination is not a directory");
      entries.push({ from, to, directory: true });
      for (const name of readdirSync(from)) visit(join(from, name), join(to, name));
    } else if (stat.isFile()) {
      if (target && !target.isFile()) throw new Error("Template destination is not a regular file");
      entries.push({ from, to, directory: false });
    } else throw new Error("Template source is not a regular file or directory");
  }
  visit(source, destination);
  for (const entry of entries) {
    mkdirSync(entry.directory ? entry.to : dirname(entry.to), { recursive: true });
    if (!entry.directory) copyFileSync(entry.from, entry.to);
  }
}
