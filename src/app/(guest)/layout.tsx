import { cacheLife } from "next/cache";
import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { ThemePattern } from "@/modules/theming/components/theme-pattern";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { invitationPreviewMetadata } from "@/modules/invitations/lib/share-metadata";

export async function generateMetadata() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 30, expire: 300 });
  return invitationPreviewMetadata(clientEnv.NEXT_PUBLIC_SITE_URL, await getPublicEventDetails());
}

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
