import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("gate signing key boundary", () => {
  const files = sourceFiles(SRC);

  it("loads the signing module only on the server", () => {
    const signing = readFileSync(join(SRC, "modules/checkin/server/signing.ts"), "utf8");
    expect(signing.split("\n")[0]).toBe('import "server-only";');
  });

  it("reads the private key variable only inside server signing code", () => {
    const readers = files
      .filter((file) => readFileSync(file, "utf8").includes("GATE_SIGNING_PRIVATE_KEY"))
      .map((file) => relative(SRC, file));
    expect(readers).toEqual(["modules/checkin/server/signing.ts"]);
  });

  it("keeps the shared verification code free of Node and server imports", () => {
    const lib = readFileSync(join(SRC, "modules/checkin/lib/gate-token.ts"), "utf8");
    expect(lib).not.toMatch(/from "node:|server-only|\/server\//);
  });

  it("never imports server signing from a client component", () => {
    const offenders = files.filter((file) => {
      const text = readFileSync(file, "utf8");
      return /^["']use client["']/m.test(text) && /checkin\/server\/signing/.test(text);
    });
    expect(offenders).toEqual([]);
  });
});
