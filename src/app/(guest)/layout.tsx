import { getActiveTheme } from "@/modules/theming";
import { ThemePattern } from "@/modules/theming/components/theme-pattern";

/** Layout for guest-facing pages (invitation, RSVP, table ordering). */
export default function GuestLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemePattern theme={getActiveTheme()} />
      {children}
    </div>
  );
}
