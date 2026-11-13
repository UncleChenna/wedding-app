import { publishedPhotoResponse } from "@/modules/invitations/server/published-photo";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return publishedPhotoResponse((await params).id);
}
