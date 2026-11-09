import { spawnSync } from "node:child_process";

// Only committed, regular generator outputs qualify. Never secrets or installed output.
export function unchangedDevelopArtifact(cwd, path) {
  if (
    typeof path !== "string" ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  )
    return false;
  if (
    !/^(?:pnpm-lock\.yaml|drizzle\/[a-zA-Z0-9_./-]+\.(?:sql|json)|src\/modules\/theming\/themes\/theme\.schema\.json)$/.test(
      path,
    )
  )
    return false;
  const run = (args) => {
    const result = spawnSync("git", args, { cwd, encoding: "utf8" });
    return result.status === 0 ? result.stdout.trim() : "";
  };
  const base = run(["rev-parse", "--verify", "refs/remotes/origin/develop^{commit}"]);
  if (!/^[a-f0-9]{40,64}$/.test(base)) return false;
  const tree = run(["ls-tree", base, "--", path]);
  const index = run(["ls-files", "--stage", "--", path]);
  const expected = /^100644 blob ([a-f0-9]+)\t/.exec(tree);
  const staged = /^100644 ([a-f0-9]+) 0\t/.exec(index);
  return Boolean(expected && staged && !index.includes("\n") && expected[1] === staged[1]);
}
