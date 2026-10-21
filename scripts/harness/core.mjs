export function safeId(value) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value ?? ""))
    throw new Error("Use an alphanumeric task id / owner (hyphens and underscores allowed).");
  return value;
}
export function branchName(owner, task) {
  safeId(owner);
  return safeId(task.id);
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
