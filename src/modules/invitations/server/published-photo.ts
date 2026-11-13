import "server-only";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/modules/shared/server/db/client";
import { readPublishedInvitationPhoto } from "@/modules/shared/server/invitation-design";
import { createLogger } from "@/modules/shared/lib/logger";

/** Explicitly published couple artwork is public; arbitrary uploads remain admin-only. */
export async function publishedPhotoResponse(id: string) {
  const headers = {
    "Cache-Control": "public, max-age=300, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex",
  };
  const invalidHeaders = { ...headers, "Cache-Control": "no-store" };
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404, headers: invalidHeaders });
  try {
    const photo = await readPublishedInvitationPhoto(db, id);
    if (!photo) return new Response(null, { status: 404, headers: invalidHeaders });
    return new Response(new Uint8Array(photo.bytes), {
      headers: { ...headers, "Content-Type": "image/webp" },
    });
  } catch (error) {
    unstable_rethrow(error);
    createLogger({ module: "invitation-photo" }).warn("Published photo unavailable");
    return new Response(null, { status: 503, headers: invalidHeaders });
  }
}
