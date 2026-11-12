import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { changedPaths, classifyChanges } from "./ci-selection.mjs";

export function planForEvent(eventName, event, cwd = process.cwd()) {
  const pr = event.pull_request;
  const forceFull =
    eventName !== "pull_request" || pr?.labels?.some((label) => label.name === "ci:full");
  let paths = [];
  let reason = forceFull
    ? "Full release/manual/ci:full verification"
    : "Exact pull request changes";
  let fallback = false;
  if (!forceFull) {
    try {
      paths = changedPaths(cwd, pr?.base?.sha, pr?.head?.sha);
    } catch {
      fallback = true;
      reason = "Cannot resolve exact PR diff: full verification";
    }
  }
  // Deleted/renamed-away modules cannot safely enter the current import graph.
  if (paths.some((path) => !existsSync(resolve(cwd, path)))) {
    fallback = true;
    reason = "Removed paths require full verification";
  }
  return {
    ...classifyChanges(paths, forceFull || fallback),
    paths,
    reason,
    base: pr?.base?.sha ?? null,
    head: pr?.head?.sha ?? null,
  };
}
export function environmentPlan() {
  return planForEvent(
    process.env.GITHUB_EVENT_NAME,
    JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")),
  );
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const plan = environmentPlan();
  if (!process.env.GITHUB_OUTPUT) throw new Error("Missing workflow output path");
  for (const key of ["full", "ui", "database", "guest", "camera", "admin"])
    appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${plan[key]}\n`);
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Verification scope\n${plan.reason}\n\nBase: ${plan.base}\nHead: ${plan.head}\n\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n`,
  );
}
