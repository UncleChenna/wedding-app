import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { ThemePattern } from "@/modules/theming/components/theme-pattern";

/** Layout for guest-facing pages (invitation, RSVP, table ordering). */
export default async function GuestLayout({ children }: LayoutProps<"/">) {
  const themes = await getStoredActiveThemes();
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemePattern themes={themes} />
      {children}
    </div>
  );
}
