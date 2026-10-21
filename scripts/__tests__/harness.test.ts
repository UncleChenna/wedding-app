import { describe, expect, it } from "vitest";
import { branchName, transitionTask, isolatedConfig, protectedPath } from "../harness/core.mjs";

const task = {
  id: "T-1",
  title: "A shared change",
  module: "shared",
  acceptance: ["works"],
  status: "todo",
  owner: null,
  branch: null,
  claimed_at: null,
  dependsOn: [],
};
describe("collaboration invariants", () => {
  it("rejects duplicate claims and releases by another owner", () => {
    const claimed = transitionTask(task, "claim", "divine", []);
    expect(claimed.status).toBe("claimed");
    expect(() => transitionTask(claimed, "claim", "friend", [])).toThrow(/claimed/);
    expect(() => transitionTask(claimed, "release", "friend", [])).toThrow(/owner/);
    expect(transitionTask(claimed, "release", "divine", []).status).toBe("todo");
  });
  it("waits for dependencies and rejects unsafe branch names", () => {
    expect(() => transitionTask({ ...task, dependsOn: ["T-0"] }, "claim", "divine", [])).toThrow(
      /depend/,
    );
    expect(branchName("divine", task)).toBe("divine/T-1-a-shared-change");
    expect(() => branchName("../../bad", task)).toThrow();
  });
  it("isolates every Supabase port and auth redirect without modifying the source config", () => {
    const source =
      'project_id = "wedding"\n[api]\nport = 54321\n[db]\nport = 54322\nshadow_port = 54320\n[auth]\nsite_url = "http://127.0.0.1:3000"\nadditional_redirect_urls = ["https://127.0.0.1:3000"]\n';
    const a = isolatedConfig(source, "wedding-a", 20000);
    const b = isolatedConfig(source, "wedding-b", 20020);
    expect(a).toContain('project_id = "wedding-a"');
    expect(a).toContain('site_url = "http://localhost:20010"');
    expect(a).not.toContain("54322");
    expect(b).not.toContain("20002");
    expect(source).toContain("54322");
  });
  it("protects secrets and generated files but allows documented examples", () => {
    for (const path of [
      ".env.local",
      "nested/.env.test",
      "pnpm-lock.yaml",
      "drizzle/0000_init.sql",
      "node_modules/x",
      ".next/cache/a",
      "src/modules/theming/themes/theme.schema.json",
    ])
      expect(protectedPath(path)).toBe(true);
    expect(protectedPath(".env.example")).toBe(false);
    expect(protectedPath("src/app/page.tsx")).toBe(false);
  });
});
