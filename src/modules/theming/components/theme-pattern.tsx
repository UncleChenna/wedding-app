import type { Theme } from "../lib/schema";

/**
 * The theme's optional paper texture behind guest pages. Renders nothing when the theme
 * has no pattern, so a plain theme gets a plain background. Purely decorative.
 */
export function ThemePattern({ theme }: { theme: Theme }) {
  if (!theme.pattern) return null;
  return <div aria-hidden="true" data-theme-pattern={theme.id} className="theme-pattern" />;
}
