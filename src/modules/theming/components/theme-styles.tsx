import { activeThemesToCssText } from "../lib/css-vars";
import type { ActiveThemes } from "../lib/schema";

/**
 * Both active themes as one stylesheet: light by default, dark when the device prefers it.
 * Place in the root <head>. The text is generated from validated theme JSON and rejects "<".
 */
export function ThemeStyles({ themes }: { themes: ActiveThemes }) {
  return (
    <style
      data-theme-styles=""
      dangerouslySetInnerHTML={{ __html: activeThemesToCssText(themes) }}
    />
  );
}
