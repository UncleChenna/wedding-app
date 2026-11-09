import { requireAdminPageAccess } from "../server/current-admin-access";
import { loadThemeEditorData } from "@/modules/theming/server/theme-editor-data";
import { ThemeEditor } from "./theme-editor";

export async function AdminThemes() {
  await requireAdminPageAccess();
  const data = await loadThemeEditorData();
  return <ThemeEditor {...data} />;
}
