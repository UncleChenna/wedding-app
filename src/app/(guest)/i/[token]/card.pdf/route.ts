import { readGuestCard } from "@/modules/invitations/server/printed-card";
import { printedCardResponse } from "@/modules/invitations/server/printed-card-response";
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return printedCardResponse(() => readGuestCard(token));
}
