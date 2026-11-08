import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { db } from "@/modules/shared/server/db/client";
import { createLogger } from "@/modules/shared/lib/logger";
import { currentAdminAccess } from "./current-admin-access";
import { loadPhoto, storePhoto } from "./photo-repository";
import { photoUploadResponse } from "./photo-upload";

export async function uploadPhoto(request: Request) {
  return photoUploadResponse(request, currentAdminAccess, (photo, userId) =>
    storePhoto(db, photo, userId),
  );
}

export async function privatePhoto(id: string) {
  const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
  try {
    if ((await currentAdminAccess()).status !== "ready")
      return new Response(null, { status: 403, headers });
    const parsed = z.uuid().safeParse(id);
    if (!parsed.success) return new Response(null, { status: 404, headers });
    const photo = await loadPhoto(db, parsed.data);
    if (!photo) return new Response(null, { status: 404, headers });
    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        ...headers,
        "Content-Type": "image/webp",
        "Content-Disposition": 'inline; filename="invitation-photo.webp"',
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "admin-photos" }).warn("photo preview unavailable");
    return new Response(null, { status: 503, headers });
  }
}
