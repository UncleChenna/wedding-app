import { describe, expect, it } from "vitest";
import { branchName, isolatedConfig, protectedPath } from "../harness/core.mjs";

const task = { id: "TICKET-001", title: "A shared change" };
describe("collaboration invariants", () => {
  // Claim, release and dependency rules moved to scripts/tickets/workflow.ts (tickets.test.ts).
  it("builds owner-scoped branch names and rejects unsafe ones", () => {
    expect(branchName("divine", task)).toBe("divine/TICKET-001-a-shared-change");
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
