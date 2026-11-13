import { findInvitationPassIdentity } from "@/modules/invitations/server/pass-identity";
import { offlinePassResponse } from "@/modules/invitations/server/offline-pass";
import { issueGatePassFrom } from "@/modules/checkin/server/issue-pass";
import { db } from "@/modules/shared/server/db/client";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { getEventSettings } from "@/modules/shared/server/settings";
import { offlinePassExpiry } from "@/modules/invitations/lib/offline-pass-expiry";
import { logger } from "@/modules/shared/lib/logger";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  try {
    const identity = await findInvitationPassIdentity(db, token);
    if (!identity) return new Response("This pass is not available.", { status: 404, headers });
    const settings = await getEventSettings(db);
    const expiresAt = offlinePassExpiry(
      settings.eventDate,
      settings.timeZone,
      settings.retentionDays,
    );
    if (!expiresAt) return new Response("Please try again shortly.", { status: 503, headers });
    if (expiresAt.getTime() <= Date.now())
      return new Response("This saved pass is no longer available.", { status: 410, headers });
    const result = await issueGatePassFrom(db, identity, clientEnv.NEXT_PUBLIC_SITE_URL);
    if (result.state !== "ready")
      return new Response("Please try again shortly.", {
        status: result.state === "absent" ? 404 : 503,
        headers,
      });
    return offlinePassResponse({
      pass: result.pass,
      tokenVersion: identity.tokenVersion,
      expiresAt,
      url: result.url,
      themes: await getStoredActiveThemes(),
    });
  } catch {
    logger.child({ module: "invitations" }).error("Offline pass could not be prepared");
    return new Response("Please try again shortly.", { status: 503, headers });
  }
}
