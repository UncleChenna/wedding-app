import type { Metadata } from "next";

import { ACTIVE_THEME_ID, listThemes } from "@/modules/theming";
import { ThemeShowcase } from "@/modules/theming/components/theme-showcase";

export const metadata: Metadata = {
  title: "Theme preview",
  robots: { index: false },
};

/** Every base component in every theme. Used for design review and visual checks. */
export default function DevThemePage() {
  return (
    <main>
      {listThemes().map((theme) => (
        <ThemeShowcase key={theme.id} theme={theme} active={theme.id === ACTIVE_THEME_ID} />
      ))}
    </main>
  );
}
