import { renderPrintedCard } from "@/modules/invitations/server/printed-card-pdf";
import { cardHeaders } from "@/modules/invitations/server/printed-card-response";
export async function GET() {
  const buffer = await renderPrintedCard({
    cardNumber: 3,
    guestName: "Sample household — preview only",
    capacity: 2,
    rsvpUrl: "https://example.com/i/sample-invitation-preview-only#reply",
  });
  return new Response(new Uint8Array(buffer), {
    headers: {
      ...cardHeaders,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="sample-invitation-card.pdf"',
    },
  });
}
