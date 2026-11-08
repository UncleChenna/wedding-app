import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createLogger } from "@/modules/shared/lib/logger";
import type { AdminAccess } from "./admin-access";
import { normalizePhoto, type NormalizedPhoto } from "./photo-image";

const maximumBytes = 8 * 1024 * 1024;
const mimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
const log = createLogger({ module: "admin-photos" });
function reply(value: object, status: number) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** Raw image body only: authorize before acquiring a reader; never fetch a supplied URL. */
export async function photoUploadResponse(
  request: Request,
  authorize: () => Promise<AdminAccess>,
  store: (photo: NormalizedPhoto, userId: string) => Promise<string | null>,
): Promise<Response> {
  try {
    const access = await authorize();
    if (access.status !== "ready")
      return reply({ message: "Please complete two-step sign-in first." }, 403);
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return reply({ message: "Please upload from the wedding admin page." }, 403);
    const mime = mimeSchema.safeParse(request.headers.get("content-type"));
    if (!mime.success) return reply({ message: "Choose a JPEG, PNG or WebP photo." }, 415);
    const declared = request.headers.get("content-length");
    if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > maximumBytes))
      return reply({ message: "Choose a photo up to 8 MB." }, 413);
    if (!request.body) return reply({ message: "Choose a photo first." }, 400);
    const reader = request.body.getReader();
    const chunks: Buffer[] = [];
    let size = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > maximumBytes) {
          await reader.cancel();
          return reply({ message: "Choose a photo up to 8 MB." }, 413);
        }
        chunks.push(Buffer.from(chunk.value));
      }
    } finally {
      reader.releaseLock();
    }
    const normalized = await normalizePhoto(Buffer.concat(chunks, size), mime.data);
    if (!normalized.ok) return reply({ message: normalized.message }, 400);
    const id = await store(normalized.value, access.userId);
    if (id === null)
      return reply({ message: "Photo storage is full. Contact the site administrator." }, 409);
    const { width, height, blurDataURL } = normalized.value;
    return reply({ id: z.uuid().parse(id), mime: "image/webp", width, height, blurDataURL }, 201);
  } catch (error) {
    unstable_rethrow(error);
    log.warn("photo upload unavailable");
    return reply({ message: "We couldn’t save the photo. Please try again." }, 503);
  }
}
