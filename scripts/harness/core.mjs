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
    /^(drizzle(?:\/|$)|supabase\/\.temp(?:\/|$))/.test(p) ||
    p.endsWith("themes/theme.schema.json")
  );
}
/** Drizzle migration output, which `pnpm db:generate` may add to without approval (TICKET-217). */
export function migrationPath(path) {
  return /^drizzle\//.test(path.replaceAll("\\", "/").replace(/^\.\//, ""));
}

/**
 * SQL that can lose data or break running code, so it still needs the owner's sign-off even in a
 * generated migration. Comments are ignored; matching is deliberately broad.
 */
export function destructiveSql(sql) {
  const code = sql.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  return [
    // Dropping an index or constraint loses no data, so routine schema tidying stays unflagged.
    /\bdrop\s+(table|column|schema|type|view|materialized\s+view|policy)\b/i,
    /\balter\s+column\b[^;]*\b(type|set\s+data\s+type)\b/i,
    /\btruncate\b/i,
    /\bdelete\s+from\b/i,
    /\brename\s+(to|column)\b/i,
  ].some((pattern) => pattern.test(code));
}

/** True when `next` only appends entries to `base` (Drizzle's migration journal). */
export function journalOnlyAppends(base, next) {
  if (!base) return true;
  const before = JSON.parse(base);
  const after = JSON.parse(next);
  const rest = (value) => JSON.stringify({ ...value, entries: undefined });
  if (rest(before) !== rest(after)) return false;
  const old = before.entries ?? [];
  const now = after.entries ?? [];
  return (
    now.length >= old.length &&
    old.every((entry, index) => JSON.stringify(entry) === JSON.stringify(now[index]))
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
