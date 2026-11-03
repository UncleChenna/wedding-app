import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { assertDatabaseTarget } from "../database-target";

const folders: string[] = [];
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});
function fixture() {
  const cwd = realpathSync(mkdtempSync(join(tmpdir(), "database-target-")));
  folders.push(cwd);
  mkdirSync(join(cwd, ".harness/supabase-project/supabase"), { recursive: true });
  writeFileSync(join(cwd, ".git"), "gitdir: /unused/fixture\n");
  const metadata = { path: cwd, project: "wedding-fixture", portBase: 25000 };
  const config = 'project_id = "wedding-fixture"\n[db]\nport = 25001\n';
  writeFileSync(join(cwd, ".harness/worktree.json"), JSON.stringify(metadata));
  writeFileSync(join(cwd, ".harness/supabase-project/supabase/config.toml"), config);
  return { cwd, metadata, config };
}
const url = "postgres://fixture:private-password@127.0.0.1:25001/postgres";
describe("database target identity", () => {
  it.each(["127.0.0.1", "localhost", "[::1]"])("accepts the managed stack at %s", (host) => {
    const { cwd } = fixture();
    expect(() => assertDatabaseTarget(url.replace("127.0.0.1", host), { cwd })).not.toThrow();
  });
  it.each([
    url.replace("25001", "54322"),
    url.replace("25001", "26001"),
    url.replace("127.0.0.1", "remote.example"),
    url.replace("/postgres", "/other"),
    url + "?host=remote.example",
    url + "?port=54322",
    url + "#fragment",
    "not-a-url",
    url.replace("postgres://", "https://"),
  ])("rejects a wrong effective target without leaking it", (target) => {
    const { cwd } = fixture();
    expect(() => assertDatabaseTarget(target, { cwd })).toThrow(/db:start/);
    try {
      assertDatabaseTarget(target, { cwd });
    } catch (error) {
      expect(String(error)).not.toContain("private-password");
      expect(String(error)).not.toContain(target);
    }
  });
  it("rejects a linked checkout with missing metadata", () => {
    const { cwd } = fixture();
    rmSync(join(cwd, ".harness/worktree.json"));
    expect(() => assertDatabaseTarget(url, { cwd })).toThrow(/db:start/);
  });
  it.each(["bad-json", "wrong-path", "wrong-project", "wrong-port", "missing-config"])(
    "rejects %s metadata",
    (kind) => {
      const { cwd, metadata, config } = fixture();
      if (kind === "bad-json") writeFileSync(join(cwd, ".harness/worktree.json"), "{");
      if (kind === "wrong-path")
        writeFileSync(
          join(cwd, ".harness/worktree.json"),
          JSON.stringify({ ...metadata, path: tmpdir() }),
        );
      if (kind === "wrong-project")
        writeFileSync(
          join(cwd, ".harness/supabase-project/supabase/config.toml"),
          config.replace("wedding-fixture", "another-stack"),
        );
      if (kind === "wrong-port")
        writeFileSync(
          join(cwd, ".harness/supabase-project/supabase/config.toml"),
          config.replace("25001", "54322"),
        );
      if (kind === "missing-config")
        rmSync(join(cwd, ".harness/supabase-project/supabase/config.toml"));
      expect(() => assertDatabaseTarget(url, { cwd })).toThrow(/db:start/);
    },
  );
  it("preserves primary and deployment URLs but keeps seed local-only", () => {
    const { cwd } = fixture();
    rmSync(join(cwd, ".git"));
    rmSync(join(cwd, ".harness"), { recursive: true });
    const remote = "postgres://fixture:password@database.example:5432/postgres?sslmode=require";
    expect(() => assertDatabaseTarget(remote, { cwd })).not.toThrow();
    expect(() => assertDatabaseTarget(remote, { cwd, localOnly: true })).toThrow(/local/);
    expect(() => assertDatabaseTarget(url, { cwd, localOnly: true })).not.toThrow();
  });
});
