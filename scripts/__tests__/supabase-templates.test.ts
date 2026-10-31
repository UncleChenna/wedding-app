import { afterEach, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { copySupabaseTemplates } from "../harness/supabase-templates.mjs";
const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "wedding-templates-"));
  roots.push(root);
  const source = join(root, "supabase/templates");
  const setup = join(root, ".harness/supabase-project");
  mkdirSync(source, { recursive: true });
  return { root, source, setup, target: join(setup, "supabase/templates") };
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
it("copies bytes, refreshes templates and preserves unrelated files", () => {
  const f = fixture();
  writeFileSync(join(f.source, "admin-code.html"), "{{ .Token }}\n");
  copySupabaseTemplates(f.root, f.setup);
  expect(readFileSync(join(f.target, "admin-code.html"))).toEqual(
    readFileSync(join(f.source, "admin-code.html")),
  );
  writeFileSync(join(f.target, "keep.txt"), "keep");
  writeFileSync(join(f.source, "admin-code.html"), "updated");
  copySupabaseTemplates(f.root, f.setup);
  expect(readFileSync(join(f.target, "admin-code.html"), "utf8")).toBe("updated");
  expect(readFileSync(join(f.target, "keep.txt"), "utf8")).toBe("keep");
});
it("allows absent optional templates", () => {
  const f = fixture();
  rmSync(f.source, { recursive: true });
  expect(() => copySupabaseTemplates(f.root, f.setup)).not.toThrow();
});
it.each(["source", "destination"])("rejects %s symlinks", (side) => {
  const f = fixture();
  const outside = join(f.root, "outside");
  mkdirSync(outside);
  writeFileSync(join(outside, "admin-code.html"), "keep");
  if (side === "source")
    symlinkSync(join(outside, "admin-code.html"), join(f.source, "admin-code.html"));
  else {
    writeFileSync(join(f.source, "admin-code.html"), "new");
    mkdirSync(join(f.setup, "supabase"), { recursive: true });
    symlinkSync(outside, f.target);
  }
  expect(() => copySupabaseTemplates(f.root, f.setup)).toThrow(/symlink/i);
  expect(readFileSync(join(outside, "admin-code.html"), "utf8")).toBe("keep");
});
it("rejects setup outside the checkout", () => {
  const f = fixture();
  expect(() => copySupabaseTemplates(f.root, join(f.root, "..", "escape"))).toThrow(/checkout/i);
});

it.each(["source-parent", "dangling-source", "destination-file"])(
  "rejects unsafe %s links before writing",
  (kind) => {
    const f = fixture();
    writeFileSync(join(f.source, "admin-code.html"), "new");
    if (kind === "source-parent") {
      rmSync(f.source, { recursive: true });
      symlinkSync(join(f.root, "missing"), f.source);
    } else if (kind === "dangling-source") {
      symlinkSync(join(f.root, "missing"), join(f.source, "missing.html"));
    } else {
      mkdirSync(f.target, { recursive: true });
      symlinkSync(join(f.root, "missing"), join(f.target, "admin-code.html"));
    }
    expect(() => copySupabaseTemplates(f.root, f.setup)).toThrow(/symlink/i);
  },
);
it("copies nested template folders", () => {
  const f = fixture();
  mkdirSync(join(f.source, "nested"));
  writeFileSync(join(f.source, "nested", "code.html"), "nested");
  copySupabaseTemplates(f.root, f.setup);
  expect(readFileSync(join(f.target, "nested", "code.html"), "utf8")).toBe("nested");
});
