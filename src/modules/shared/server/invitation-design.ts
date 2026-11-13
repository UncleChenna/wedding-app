import "server-only";
import { and, eq } from "drizzle-orm";
import type { Db } from "./db/client";
import { invitationDesign, invitationPhotos } from "./db/schema";
import type { InvitationDesignInput } from "../lib/invitation-design";

/** Public wording and selected-photo metadata only; never exposes uploader or unpublished assets. */
export async function readInvitationDesign(database: Pick<Db, "select">) {
  const [row] = await database
    .select({
      version: invitationDesign.version,
      photoId: invitationDesign.photoId,
      photoAlt: invitationDesign.photoAlt,
      headline: invitationDesign.headline,
      subline: invitationDesign.subline,
      width: invitationPhotos.width,
      height: invitationPhotos.height,
      blurDataURL: invitationPhotos.blurDataUrl,
    })
    .from(invitationDesign)
    .leftJoin(invitationPhotos, eq(invitationDesign.photoId, invitationPhotos.id))
    .where(eq(invitationDesign.id, 1))
    .limit(1);
  return row ?? null;
}

/** Admin caller authorizes first. Version checks prevent one editor overwriting another. */
export async function saveInvitationDesign(
  database: Pick<Db, "transaction">,
  input: InvitationDesignInput,
  actorId: string,
) {
  return database.transaction(async (tx) => {
    if (input.photoId) {
      const [photo] = await tx
        .select({ id: invitationPhotos.id })
        .from(invitationPhotos)
        .where(eq(invitationPhotos.id, input.photoId))
        .limit(1);
      if (!photo)
        return { status: "error", message: "Choose an uploaded photo before saving." } as const;
    }
    const values = {
      photoId: input.photoId,
      photoAlt: input.photoId ? input.photoAlt : "",
      headline: input.headline,
      subline: input.subline,
      updatedBy: actorId,
      updatedAt: new Date(),
      version: input.version + 1,
    };
    const saved =
      input.version === 0
        ? await tx
            .insert(invitationDesign)
            .values({ id: 1, ...values })
            .onConflictDoNothing()
            .returning({ version: invitationDesign.version })
        : await tx
            .update(invitationDesign)
            .set(values)
            .where(and(eq(invitationDesign.id, 1), eq(invitationDesign.version, input.version)))
            .returning({ version: invitationDesign.version });
    if (!saved[0])
      return {
        status: "error",
        message:
          "The invitation changed in another window. Reload before saving; keep a copy of your wording first.",
      } as const;
    return {
      status: "saved",
      version: saved[0].version,
      message: "Your invitation design is saved.",
    } as const;
  });
}

/** Serves the selected public asset. Previously published copies may remain in caches. */
export async function readPublishedInvitationPhoto(database: Pick<Db, "select">, id: string) {
  const [row] = await database
    .select({ bytes: invitationPhotos.bytes })
    .from(invitationDesign)
    .innerJoin(invitationPhotos, eq(invitationDesign.photoId, invitationPhotos.id))
    .where(and(eq(invitationDesign.id, 1), eq(invitationPhotos.id, id)))
    .limit(1);
  return row ?? null;
}
