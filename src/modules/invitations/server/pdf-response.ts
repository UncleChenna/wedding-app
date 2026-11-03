import "server-only";
import { z } from "zod";
import { invitationTokenSchema } from "../lib/token";
import { logger } from "@/modules/shared/lib/logger";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};
export type PdfOutcome =
  { state: "ready"; buffer: Uint8Array } | { state: "absent" | "unavailable" };
export async function invitationPdfResponse(
  token: unknown,
  scheme: unknown,
  generate: (token: string, scheme: "light" | "dark") => Promise<PdfOutcome>,
) {
  const parsed = invitationTokenSchema.safeParse(token);
  const appearance = z
    .enum(["light", "dark"])
    .default("light")
    .safeParse(scheme ?? undefined);
  if (!parsed.success || !appearance.success)
    return new Response("We couldn't find this invitation. Please check your personal link.", {
      status: 404,
      headers,
    });
  try {
    const result = await generate(parsed.data, appearance.data);
    if (result.state !== "ready")
      return new Response("Your PDF is not ready just yet. Please return to your invitation.", {
        status: result.state === "absent" ? 404 : 503,
        headers,
      });
    return new Response(new Uint8Array(result.buffer), {
      headers: {
        ...headers,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="wedding-invitation.pdf"',
      },
    });
  } catch {
    // Neither the credential nor private guest data is logged.
    logger.child({ module: "invitations" }).error("Invitation PDF could not be rendered");
    return new Response("We couldn't prepare your PDF. Please try again shortly.", {
      status: 503,
      headers,
    });
  }
}
