import { uploadPhoto } from "@/modules/admin/server/photo-handlers";

export async function POST(request: Request) {
  return uploadPhoto(request);
}
