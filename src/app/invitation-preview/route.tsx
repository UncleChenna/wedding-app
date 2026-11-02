import { getPublicEventDetails } from "@/modules/invitations/server/public-event-details";
import { z } from "zod";
import { getTheme, listThemes } from "@/modules/theming";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { renderInvitationPreview } from "@/modules/invitations/server/preview-image";

export async function GET(request: Request) {
  const requestedTheme = new URL(request.url).searchParams.get("theme");
  if (requestedTheme !== null) {
    const parsed = z
      .string()
      .max(100)
      .refine((id) => listThemes().some((theme) => theme.id === id))
      .safeParse(requestedTheme);
    if (!parsed.success) return new Response("Unknown theme", { status: 400 });
  }
  const theme = requestedTheme ? getTheme(requestedTheme) : (await getStoredActiveThemes()).light;
  return renderInvitationPreview(theme, await getPublicEventDetails());
}
