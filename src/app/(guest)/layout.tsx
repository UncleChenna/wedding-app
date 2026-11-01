import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { ThemePattern } from "@/modules/theming/components/theme-pattern";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";

export const metadata = invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL);

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
