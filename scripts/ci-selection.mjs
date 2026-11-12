/** Conservative PR impact selection. Git errors never mean "nothing changed". */
import { execFileSync } from "node:child_process";

export function changedPaths(cwd, base, head) {
  if (![base, head].every((value) => /^[a-f0-9]{40,64}$/i.test(value)))
    throw new Error("CI requires exact base and head object IDs");
  // --no-renames deliberately exposes old and new names as delete/add; NUL preserves all filenames.
  return execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "-z", `${base}...${head}`, "--"],
    {
      cwd,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      // Explicit checkout wins over inherited Git hook repository redirection.
      env: Object.fromEntries(
        Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")),
      ),
    },
  )
    .split("\0")
    .filter(Boolean);
}

export function classifyChanges(paths, forceFull = false) {
  const plan = {
    full: false,
    ui: false,
    database: false,
    guest: false,
    camera: false,
    admin: false,
  };
  const full = () => ({
    full: true,
    ui: true,
    database: true,
    guest: true,
    camera: true,
    admin: true,
  });
  if (forceFull || paths.length === 0) return full();
  for (const path of paths) {
    if (/^(docs\/.*\.md|tickets\/TICKET-\d+[^/]*\.md)$/.test(path)) continue;
    const feature = path.match(/^src\/modules\/(invitations|ordering|admin|checkin)\//)?.[1];
    if (!feature) return full();
    if (/\.(tsx|css|json|svg|png|jpg|jpeg|webp|avif)$/.test(path)) plan.ui = true;
    if (!/\.(ts|tsx|css|json|svg|png|jpg|jpeg|webp|avif)$/.test(path)) return full();
    if (path.includes("/server/")) {
      plan.database = true;
      // Server contracts can affect cross-feature callers, auth and persistence.
      plan.guest = true;
      plan.admin = true;
    }
    if (feature === "admin") plan.admin = true;
    if (feature === "invitations" || feature === "ordering") plan.guest = true;
    if (feature === "checkin") {
      plan.camera = true;
      plan.guest = true;
      plan.admin = true;
    }
  }
  return plan;
}

export function validateGates(selected, results) {
  const failures = Object.entries(selected)
    .filter(([name, required]) =>
      required ? results[name] !== "success" : !["success", "skipped"].includes(results[name]),
    )
    .map(([name]) => name);
  return { ok: failures.length === 0, failures };
}
