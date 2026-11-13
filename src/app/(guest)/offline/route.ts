import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { offlineDocument } from "@/modules/shared/server/offline-document";

export async function GET() {
  return new Response(
    offlineDocument(await getStoredActiveThemes(), await getPublicEventDetails()),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
