import { randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import { normalizePhoto } from "../../src/modules/admin/server/photo-image";
import { loadPhoto, storePhoto } from "../../src/modules/admin/server/photo-repository";

let client: Sql;
const rollback = new Error("rollback synthetic photo fixtures");
describe.runIf(process.env.RUN_PHOTO_DB_TESTS === "1")("photo persistence", () => {
  beforeAll(() => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    client = postgres(url, { max: 2, prepare: false });
  });
  afterAll(async () => {
    if (client) await client.end();
  });
  it("round-trips sanitized bytes, bounds the gallery and denies anonymous access", async () => {
    const raw = await sharp({ create: { width: 80, height: 40, channels: 3, background: "ivory" } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    const normalized = await normalizePhoto(raw, "image/jpeg");
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;
    const database = drizzle(client, { schema });
    try {
      await database.transaction(async (tx) => {
        const prior = await tx
          .select({ slot: schema.invitationPhotos.slot })
          .from(schema.invitationPhotos);
        if (prior.length) throw new Error("Photo fixture requires an empty isolated gallery");
        const id = await storePhoto(tx, normalized.value, randomUUID());
        expect(id).not.toBeNull();
        const saved = await loadPhoto(tx, id ?? "");
        expect(saved?.bytes).toEqual(normalized.value.bytes);
        const meta = await sharp(saved?.bytes).metadata();
        expect(meta).toMatchObject({ format: "webp", width: 40, height: 80 });
        expect(meta.exif).toBeUndefined();
        for (let index = 1; index < 16; index++)
          expect(await storePhoto(tx, normalized.value, randomUUID())).not.toBeNull();
        expect(await storePhoto(tx, normalized.value, randomUUID())).toBeNull();
        await tx.transaction(async (nested) => {
          const { sql } = await import("drizzle-orm");
          await nested.execute(sql`set local role anon`);
          expect(await nested.select().from(schema.invitationPhotos)).toEqual([]);
        });
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });
});
