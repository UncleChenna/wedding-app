import { afterEach, expect, it } from "vitest";
import {
  realpathSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  prepareAdminJourneyCi,
  journeyEnvironment,
  assertAdminJourneyTarget,
} from "../admin-journey-ci";
const roots: string[] = [];
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "admin-journey-")));
  roots.push(root);
  mkdirSync(join(root, ".git"));
  mkdirSync(join(root, "supabase/templates"), { recursive: true });
  writeFileSync(
    join(root, "supabase/config.toml"),
    'project_id = "wedding"\n[api]\nport = 54321\n[db]\nport = 54322\n',
  );
  writeFileSync(join(root, "supabase/templates/admin-code.html"), "{{ .Token }}");
  writeFileSync(join(root, ".env.example"), "LOG_LEVEL=info\n");
  return root;
}
const hosted = (root: string) => ({
  CI: "true",
  GITHUB_ACTIONS: "true",
  RUNNER_ENVIRONMENT: "github-hosted",
  GITHUB_WORKSPACE: root,
  GITHUB_RUN_ID: "123",
  GITHUB_RUN_ATTEMPT: "2",
});
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
it("creates a distinct hosted checkout identity and copies actual mail templates", () => {
  const root = fixture();
  prepareAdminJourneyCi(root, hosted(root));
  const meta = JSON.parse(readFileSync(join(root, ".harness/worktree.json"), "utf8"));
  expect(meta).toMatchObject({
    path: root,
    project: "wedding-admin-123-2",
    portBase: 28000,
    pwPort: 28011,
  });
  expect(
    readFileSync(join(root, ".harness/supabase-project/supabase/config.toml"), "utf8"),
  ).toContain("port = 28001");
  expect(
    readFileSync(
      join(root, ".harness/supabase-project/supabase/templates/admin-code.html"),
      "utf8",
    ),
  ).toBe("{{ .Token }}");
});
it.each(["CI", "GITHUB_ACTIONS", "RUNNER_ENVIRONMENT", "GITHUB_WORKSPACE", "GITHUB_RUN_ID"])(
  "refuses invalid hosted guard %s before writing",
  (key) => {
    const root = fixture();
    expect(() => prepareAdminJourneyCi(root, { ...hosted(root), [key]: "invalid" })).toThrow(
      /fresh hosted/i,
    );
  },
);
it.each([".env.local", ".harness"])("preserves an existing %s", (name) => {
  const root = fixture();
  writeFileSync(join(root, name), "do not replace");
  expect(() => prepareAdminJourneyCi(root, hosted(root))).toThrow(/fresh hosted/i);
  expect(readFileSync(join(root, name), "utf8")).toBe("do not replace");
});
it("rejects a linked checkout rather than borrowing its stack", () => {
  const root = fixture();
  rmSync(join(root, ".git"), { recursive: true });
  writeFileSync(join(root, ".git"), "gitdir: elsewhere");
  expect(() => prepareAdminJourneyCi(root, hosted(root))).toThrow(/fresh hosted/i);
});
it("refuses symlinked fixture sources", () => {
  const root = fixture();
  symlinkSync(tmpdir(), join(root, "supabase/templates/link"));
  expect(() => prepareAdminJourneyCi(root, hosted(root))).toThrow(/symlink/i);
});
it("generated local targets override inherited CI defaults without changing unrelated variables", () => {
  expect(
    journeyEnvironment(
      { DATABASE_URL: "wrong", PATH: "bin", NODE_ENV: "test" },
      { DATABASE_URL: "local" },
    ),
  ).toMatchObject({ DATABASE_URL: "local", PATH: "bin" });
});

it("runs the real admin suite in its own CI job and retains only sanitized evidence", () => {
  const workflow = readFileSync(
    join(import.meta.dirname, "../../.github/workflows/ci.yml"),
    "utf8",
  );
  const job = workflow.match(/^  admin-journey:\n([\s\S]*?)(?=^  [a-z][\w-]*:|$(?![\s\S]))/m)?.[1];
  expect(job).toContain("pnpm exec tsx scripts/test-admin-journey.ts --ci");
  expect(job).toContain("path: artifacts/TICKET-134/");
  expect(job).not.toContain("test-results/");
  expect(job).not.toContain("playwright-report/");
  expect(job).toContain("if: always()");
  expect(job).toContain("pnpm db:stop");
});

it("rejects another local database or Auth stack before fixture writes", () => {
  const root = fixture();
  prepareAdminJourneyCi(root, hosted(root));
  const correct = {
    DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:28001/postgres",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:28000",
  };
  expect(assertAdminJourneyTarget(root, correct).pwPort).toBe(28011);
  expect(() =>
    assertAdminJourneyTarget(root, {
      ...correct,
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    }),
  ).toThrow(/Database target refused/);
  for (const url of [
    "http://127.0.0.1:54321",
    "https://example.com",
    "http://127.0.0.1:28000?other=true",
  ])
    expect(() =>
      assertAdminJourneyTarget(root, { ...correct, NEXT_PUBLIC_SUPABASE_URL: url }),
    ).toThrow(/identity mismatch/);
  writeFileSync(
    join(root, ".harness/worktree.json"),
    JSON.stringify({ path: root, portBase: 28000, pwPort: 28012 }),
  );
  expect(() => assertAdminJourneyTarget(root, correct)).toThrow();
});
