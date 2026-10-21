export function safeId(value) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value ?? ""))
    throw new Error("Use an alphanumeric task id / owner (hyphens and underscores allowed).");
  return value;
}
export function branchName(owner, task) {
  const slug =
    task.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "task";
  return `${safeId(owner)}/${safeId(task.id)}-${slug}`;
}
export function transitionTask(task, action, owner, tasks) {
  safeId(owner);
  if (action === "claim") {
    if (task.status !== "todo")
      throw new Error(`${task.id} is already ${task.status}; claim refused.`);
    if (task.blocked_reason) throw new Error(`Task blocked: ${task.blocked_reason}`);
    if ((task.dependsOn ?? []).some((id) => !tasks.some((t) => t.id === id && t.status === "done")))
      throw new Error("Unfinished dependency.");
    return {
      ...task,
      status: "claimed",
      owner,
      branch: branchName(owner, task),
      claimed_at: new Date().toISOString(),
    };
  }
  if (task.owner !== owner) throw new Error("Only the task owner can change its claim.");
  if (action === "release") {
    if (task.status === "done") throw new Error("Cannot release completed work.");
    return { ...task, status: "todo", owner: null, branch: null, claimed_at: null };
  }
  if (action === "review" && task.status === "claimed") return { ...task, status: "in_review" };
  if (action === "done" && task.status === "in_review") return { ...task, status: "done" };
  throw new Error(`Invalid transition ${task.status} → ${action}`);
}
export function protectedPath(path) {
  const p = path.replaceAll("\\", "/").replace(/^\.\//, "");
  return (
    /(^|\/)\.env(?!\.example$)([^/]*)(\/|$)/.test(p) ||
    /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/.test(p) ||
    /(^|\/)(node_modules|\.next|\.git)(\/|$)/.test(p) ||
    /^(drizzle\/|supabase\/\.temp\/)/.test(p) ||
    p.endsWith("themes/theme.schema.json")
  );
}
export function isolatedConfig(source, project, base) {
  safeId(project);
  const ports = new Map();
  let i = 0;
  return source
    .replace(/^project_id\s*=.*$/m, `project_id = "${project}"`)
    .replace(
      /^(\s*(?:port|shadow_port|inspector_port|smtp_port|pop3_port)\s*=\s*)(\d+)/gm,
      (_, prefix, original) => {
        if (!ports.has(original)) ports.set(original, base + i++);
        if (i > 10) throw new Error("Supabase config has too many ports for reserved block.");
        return `${prefix}${ports.get(original)}`;
      },
    )
    .replace(/^site_url\s*=.*$/m, `site_url = "http://localhost:${base + 10}"`)
    .replace(
      /^additional_redirect_urls\s*=.*$/m,
      `additional_redirect_urls = ["http://localhost:${base + 10}", "http://127.0.0.1:${base + 10}"]`,
    );
}
