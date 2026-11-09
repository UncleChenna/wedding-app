import { loadTheme, type Theme } from "@/modules/theming";

export function copyThemeDraft(theme: Theme, id: string): Theme {
  const draft = structuredClone(theme);
  draft.id = id;
  delete draft.pattern;
  return draft;
}

export function themeDraftProblem(theme: Theme): string | null {
  try {
    loadTheme(theme);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Please check the theme values.";
  }
}
