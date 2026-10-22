/** Pure helpers for `scripts/db-check.ts`, unit-tested without a database. */

export interface TableRls {
  table: string;
  rlsEnabled: boolean;
}

/**
 * Public tables that do not have row-level security enabled, sorted.
 * An empty list of tables is an error: it usually means the wrong database or
 * an unmigrated one, and must never pass as "all tables protected".
 */
export function tablesMissingRls(tables: readonly TableRls[]): string[] {
  if (!tables.length) throw new Error("No public tables found: is the database migrated?");
  return tables
    .filter((t) => !t.rlsEnabled)
    .map((t) => t.table)
    .sort();
}

export interface CountsReport {
  tables: Record<string, number>;
  migrationsApplied: number;
}

/** One sorted line per table, then the applied-migration count, so two runs diff cleanly. */
export function formatCounts(report: CountsReport): string {
  const lines = Object.entries(report.tables)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([table, count]) => `${table} ${count}`);
  return `${lines.join("\n")}\n(drizzle migrations applied) ${report.migrationsApplied}\n`;
}
