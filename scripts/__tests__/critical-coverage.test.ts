import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import config from "../../vitest.config";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../../", import.meta.url));

it("keeps pnpm test coverage enabled for every critical file, with per-file line and branch floors", async () => {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as {
    scripts: { test: string };
    devDependencies: Record<string, string>;
  };
  expect(pkg.scripts.test).toBe("vitest run --coverage --maxWorkers=2");
  expect(config.test?.coverage).toMatchObject({
    provider: "v8",
    include: [
      "src/modules/checkin/lib/**/*.ts",
      "src/modules/invitations/lib/token.ts",
      "src/modules/ordering/lib/order.ts",
      "src/modules/ordering/lib/order-limits.ts",
    ],
    thresholds: { perFile: true, lines: 95, branches: 95 },
  });
  expect(config.test?.coverage?.exclude).toBeUndefined();
  const vitest = JSON.parse(
    await readFile(join(root, "node_modules/vitest/package.json"), "utf8"),
  ) as { version: string };
  expect(pkg.devDependencies["@vitest/coverage-v8"]).toBe(vitest.version);
});

it("the real coverage gate rejects a missed branch and an entirely unimported critical file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ticket-130-coverage-"));
  try {
    await mkdir(join(directory, "critical"));
    const testPath = join(directory, "critical.test.ts");
    const coverage = config.test?.coverage;
    if (!coverage) throw new Error("Coverage configuration missing");
    await writeFile(
      join(directory, "vitest.config.mjs"),
      `export default ${JSON.stringify({
        root: directory,
        test: {
          include: ["critical.test.ts"],
          coverage: {
            ...coverage,
            include: ["critical/**/*.ts"],
            reportsDirectory: join(directory, "coverage"),
            reporter: ["text", "json-summary"],
          },
        },
      })};`,
    );
    await writeFile(
      join(directory, "critical", "decision.ts"),
      "export function decision(yes: boolean) { if (yes) return 'yes'; return 'no'; }\n",
    );
    // A heavily covered neighbor keeps aggregate metrics above 95% in both failing cases.
    // Only per-file enforcement can catch the weak decision/unimported module below.
    await writeFile(
      join(directory, "critical", "neighbor.ts"),
      `export function neighbor(n: number) { switch(n) {\n${Array.from({ length: 100 }, (_, n) => `case ${n}: return ${n};`).join("\n")}\ndefault: return -1;\n} }\n`,
    );
    const preamble = `import {it,expect} from ${JSON.stringify(pathToFileURL(join(root, "node_modules/vitest/dist/index.js")).href)};\nimport {decision} from './critical/decision';\nimport {neighbor} from './critical/neighbor';\nfor(let n=0;n<=100;n++)expect(neighbor(n)).toBe(n<100?n:-1);\n`;
    const expectHealthyAggregate = async () => {
      const summary = JSON.parse(
        await readFile(join(directory, "coverage/coverage-summary.json"), "utf8"),
      ) as {
        total: { lines: { pct: number }; branches: { pct: number } };
      };
      expect(summary.total.lines.pct).toBeGreaterThanOrEqual(95);
      expect(summary.total.branches.pct).toBeGreaterThanOrEqual(95);
    };
    await writeFile(
      testPath,
      preamble +
        "it('covers both outcomes',()=>{expect(decision(true)).toBe('yes');expect(decision(false)).toBe('no');});\n",
    );
    const command = () =>
      run(
        process.execPath,
        [
          resolve(root, "node_modules/vitest/vitest.mjs"),
          "run",
          "--coverage",
          "--config",
          join(directory, "vitest.config.mjs"),
        ],
        { cwd: root, timeout: 20_000, maxBuffer: 2_000_000 },
      );
    const control = await command();
    expect(control.stdout).toContain("1 passed");

    await writeFile(
      testPath,
      preamble + "it('covers only one outcome',()=>{expect(decision(true)).toBe('yes');});\n",
    );
    const missedBranch = await command().then(
      () => null,
      (error: { stdout: string; stderr: string; code: number }) => error,
    );
    expect(missedBranch?.code).toBe(1);
    expect(missedBranch?.stdout).toContain("1 passed");
    expect(missedBranch?.stderr).toMatch(/coverage.*branches.*95%/i);
    await expectHealthyAggregate();

    await writeFile(
      testPath,
      preamble +
        "it('covers both outcomes',()=>{expect(decision(true)).toBe('yes');expect(decision(false)).toBe('no');});\n",
    );
    await writeFile(
      join(directory, "critical", "unimported.ts"),
      "export function untested() { return 42; }\n",
    );
    const unimported = await command().then(
      () => null,
      (error: { stdout: string; stderr: string; code: number }) => error,
    );
    expect(unimported?.code).toBe(1);
    expect(unimported?.stdout).toContain("1 passed");
    expect(unimported?.stderr).toMatch(/coverage.*lines.*95%/i);
    expect(unimported?.stderr).toContain("unimported.ts");
    await expectHealthyAggregate();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 60_000);
