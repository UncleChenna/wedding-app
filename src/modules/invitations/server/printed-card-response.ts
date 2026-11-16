import "server-only";
import { createLogger } from "@/modules/shared/lib/logger";
import type { PrintedCardDetails } from "../lib/printed-card";
import { renderPrintedCard } from "./printed-card-pdf";

export const cardHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};
export async function printedCardResponse(
  load: () => Promise<(PrintedCardDetails & { rsvpUrl: string }) | null>,
) {
  try {
    const card = await load();
    if (!card)
      return new Response("This invitation is unavailable.", { status: 404, headers: cardHeaders });
    return new Response(new Uint8Array(await renderPrintedCard(card)), {
      headers: {
        ...cardHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invitation-card-${card.cardNumber}.pdf"`,
      },
    });
  } catch {
    createLogger({ module: "invitation-card" }).warn("Invitation card unavailable");
    return new Response("Your card is unavailable just now. Please try again shortly.", {
      status: 503,
      headers: cardHeaders,
    });
  }
}
