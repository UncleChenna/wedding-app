import "server-only";
import type { IssuedGatePass } from "@/modules/checkin/server/issue-pass";
import type { Theme } from "@/modules/theming";
import { renderPassImage, type PassImageData } from "./pass-image";
import { logger } from "@/modules/shared/lib/logger";

type Identity = { id: string; tokenVersion: number };
export async function passImageResponse(
  token: unknown,
  deps: {
    identify(token: unknown): Promise<Identity | null>;
    issue(identity: Identity): Promise<IssuedGatePass>;
    theme(): Promise<Theme>;
    render?: (data: PassImageData, theme: Theme) => Promise<Response>;
  },
) {
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow, noarchive",
  };
  try {
    const identity = await deps.identify(token);
    if (!identity) return new Response("This pass is not available.", { status: 404, headers });
    const issued = await deps.issue(identity);
    if (issued.state !== "ready")
      return new Response("This pass is not available just yet.", {
        status: issued.state === "absent" ? 404 : 503,
        headers,
      });
    // Explicit allowlist: never pass the household's contact, meals, table or editing capability to the renderer.
    return await (deps.render ?? renderPassImage)(
      {
        name: issued.pass.names.join(" & ") || issued.pass.householdName || "Our dear guest",
        partySize: issued.pass.partySize,
        url: issued.url,
      },
      await deps.theme(),
    );
  } catch {
    logger.child({ module: "invitations" }).warn("Pass image could not be prepared");
    return new Response("We couldn't prepare your image. Please keep a screenshot of your pass.", {
      status: 503,
      headers,
    });
  }
}
