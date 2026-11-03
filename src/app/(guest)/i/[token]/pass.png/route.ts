import { findInvitationPassIdentity } from "@/modules/invitations/server/pass-identity";
import { passImageResponse } from "@/modules/invitations/server/pass-image-response";
import { issueGatePassFrom } from "@/modules/checkin/server/issue-pass";
import { db } from "@/modules/shared/server/db/client";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const scheme = new URL(request.url).searchParams.get("scheme");
  return passImageResponse(token, {
    identify: (value) => findInvitationPassIdentity(db, value),
    issue: (identity) => issueGatePassFrom(db, identity, clientEnv.NEXT_PUBLIC_SITE_URL),
    theme: async () => (await getStoredActiveThemes())[scheme === "dark" ? "dark" : "light"],
  });
}
