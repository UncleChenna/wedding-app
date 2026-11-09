import { describe, expect, it } from "vitest";
import { getTheme } from "@/modules/theming";
import { copyThemeDraft, themeDraftProblem } from "../lib/theme-editor";

describe("theme editor drafts", () => {
  it("copies a preset without mutating it or retaining a preset-only texture path", () => {
    const preset = getTheme("ivory-gold");
    const draft = copyThemeDraft(preset, "wedding-light");
    expect(draft.id).toBe("wedding-light");
    expect(draft.pattern).toBeUndefined();
    expect(themeDraftProblem(draft)).toBeNull();
    draft.colors.primary = preset.colors.foreground;
    expect(preset.colors.primary).not.toBe(draft.colors.primary);
  });
  it("names failing contrast pairs and accepts curated preset tokens", () => {
    const draft = copyThemeDraft(getTheme("ivory-gold"), "wedding-light");
    draft.colors.foreground = draft.colors.background;
    expect(themeDraftProblem(draft)).toContain("foreground");
    expect(themeDraftProblem(draft)).toContain("background");
    expect(themeDraftProblem(getTheme("emerald-night"))).toBeNull();
  });
});
