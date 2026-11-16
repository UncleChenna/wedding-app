import { readAdminCard } from "@/modules/invitations/server/printed-card";
import {
  printedCardResponse,
  cardHeaders,
} from "@/modules/invitations/server/printed-card-response";
import { currentAdminAccess } from "@/modules/admin/server/current-admin-access";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if ((await currentAdminAccess()).status !== "ready")
    return new Response("Please sign in.", { status: 403, headers: cardHeaders });
  const { id } = await params;
  return printedCardResponse(() => readAdminCard(id));
}
