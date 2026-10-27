import type { Metadata } from "next";

import { SharePreview } from "@/modules/admin/components/share-preview";
import { getActiveTheme, listThemes } from "@/modules/theming";

export const metadata: Metadata = { title: "Sharing preview", robots: { index: false } };

export default function SharePreviewPage() {
  return <SharePreview themes={listThemes()} initialTheme={getActiveTheme()} />;
}
