import { checkThemeContrast, formatContrastFailures } from "./contrast";
import { themeSchema, type Theme } from "./schema";

export class ThemeValidationError extends Error {
  override name = "ThemeValidationError";
}

/**
 * Validate raw theme JSON against the schema and WCAG AA contrast rules.
 * Throws a ThemeValidationError describing every problem.
 */
export function loadTheme(raw: unknown): Theme {
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) {
    const id =
      typeof raw === "object" && raw !== null && "id" in raw ? String(raw.id) : "(unknown)";
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new ThemeValidationError(`Theme "${id}" is invalid:\n${details}`);
  }
  const failures = checkThemeContrast(parsed.data);
  if (failures.length > 0) {
    throw new ThemeValidationError(formatContrastFailures(parsed.data.id, failures));
  }
  return parsed.data;
}
