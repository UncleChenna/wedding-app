import { privatePhoto } from "@/modules/admin/server/photo-handlers";

export async function GET(_request: Request, context: RouteContext<"/api/admin/photos/[id]">) {
  const { id } = await context.params;
  return privatePhoto(id);
}
