import "server-only";
import { eq, sql } from "drizzle-orm";
import type { Db } from "@/modules/shared/server/db/client";
import { invitationPhotos } from "@/modules/shared/server/db/schema";
import type { NormalizedPhoto } from "./photo-image";

/** Call only after authorization and normalization. The fixed slot range bounds storage in SQL. */
export async function storePhoto(
  database: Pick<Db, "transaction">,
  photo: NormalizedPhoto,
  userId: string,
): Promise<string | null> {
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(175, 1)`);
    const occupied = new Set(
      (await tx.select({ slot: invitationPhotos.slot }).from(invitationPhotos)).map(
        (row) => row.slot,
      ),
    );
    const slot = Array.from({ length: 16 }, (_, index) => index + 1).find(
      (candidate) => !occupied.has(candidate),
    );
    if (slot === undefined) return null;
    const [saved] = await tx
      .insert(invitationPhotos)
      .values({
        slot,
        bytes: photo.bytes,
        width: photo.width,
        height: photo.height,
        blurDataUrl: photo.blurDataURL,
        uploadedBy: userId,
      })
      .returning({ id: invitationPhotos.id });
    return saved?.id ?? null;
  });
}

/** Private delivery only; the caller must independently enforce admin access. */
export async function loadPhoto(database: Pick<Db, "select">, id: string) {
  const [photo] = await database
    .select({ bytes: invitationPhotos.bytes })
    .from(invitationPhotos)
    .where(eq(invitationPhotos.id, id))
    .limit(1);
  return photo ?? null;
}
