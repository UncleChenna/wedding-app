import { findInvitationPassIdentity } from "@/modules/invitations/server/pass-identity";
import { invitationPdfResponse } from "@/modules/invitations/server/pdf-response";
import { renderInvitationPdf } from "@/modules/invitations/server/pdf";
import { issueGatePassFrom } from "@/modules/checkin/server/issue-pass";
import { db } from "@/modules/shared/server/db/client";
import { getEventSettings } from "@/modules/shared/server/settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return invitationPdfResponse(
    token,
    new URL(request.url).searchParams.get("scheme"),
    async (credential, scheme) => {
      const identity = await findInvitationPassIdentity(db, credential);
      if (!identity) return { state: "absent" };
      const issued = await issueGatePassFrom(db, identity, clientEnv.NEXT_PUBLIC_SITE_URL);
      if (issued.state !== "ready") return issued;
      const [details, themes] = await Promise.all([getEventSettings(), getStoredActiveThemes()]);
      return {
        state: "ready",
        buffer: await renderInvitationPdf({
          details,
          theme: themes[scheme],
          pass: issued.pass,
          passUrl: issued.url,
        }),
      };
    },
  );
}
