import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../src/modules/shared/server/db/schema";
import { assertDatabaseTarget } from "../database-target";
import type * as Design from "../../src/modules/shared/server/invitation-design";

describe.skipIf(process.env.RUN_INVITATION_DESIGN_DB_TESTS !== "1")(
  "invitation design persistence",
  () => {
    let sql: Sql;
    let service: typeof Design;
    const actor = randomUUID();
    const photo = randomUUID();
    const input = {
      version: 0,
      photoId: null,
      photoAlt: "",
      headline: "Together, always.",
      subline: "Join our celebration.",
    };
    beforeAll(async () => {
      assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
      sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
      if (
        (await sql`select id from invitation_design`).length ||
        (await sql`select id from invitation_photos`).length
      )
        throw new Error("Design tests require an empty owned fixture database");
      service = await import("../../src/modules/shared/server/invitation-design");
    });
    afterAll(async () => {
      if (!sql) return;
      try {
        await sql`delete from invitation_design where updated_by=${actor}`;
        await sql`delete from invitation_photos where uploaded_by=${actor}`;
      } finally {
        await sql.end();
      }
    });
    it("rejects unknown photos without changing the design", async () => {
      const db = drizzle(sql, { schema });
      expect(await service.readInvitationDesign(db)).toBeNull();
      expect(
        await service.saveInvitationDesign(
          db,
          { ...input, photoId: randomUUID(), photoAlt: "Our portrait" },
          actor,
        ),
      ).toMatchObject({ status: "error" });
      expect(await service.readInvitationDesign(db)).toBeNull();
    });
    it("preserves saved wording and rejects stale-window overwrites", async () => {
      const db = drizzle(sql, { schema });
      expect(await service.saveInvitationDesign(db, input, actor)).toMatchObject({
        status: "saved",
        version: 1,
      });
      expect(
        await service.saveInvitationDesign(db, { ...input, headline: "Stale change" }, actor),
      ).toMatchObject({ status: "error" });
      expect(await service.readInvitationDesign(db)).toMatchObject({
        headline: input.headline,
        version: 1,
      });
    });
    it("exposes only the explicitly selected photo, and removing it restores the fallback", async () => {
      const db = drizzle(sql, { schema });
      const bytes = Buffer.from([1, 2, 3]);
      await sql`insert into invitation_photos(slot,id,bytes,width,height,blur_data_url,uploaded_by) values(1,${photo},${bytes},100,100,'data:image/webp;base64,AAAA',${actor})`;
      expect(await service.readPublishedInvitationPhoto(db, photo)).toBeNull();
      expect(
        await service.saveInvitationDesign(
          db,
          { ...input, version: 1, photoId: photo, photoAlt: "The couple in a garden" },
          actor,
        ),
      ).toMatchObject({ status: "saved", version: 2 });
      expect(await service.readPublishedInvitationPhoto(db, photo)).toEqual({ bytes });
      expect(await service.readPublishedInvitationPhoto(db, randomUUID())).toBeNull();
      expect(await service.saveInvitationDesign(db, { ...input, version: 2 }, actor)).toMatchObject(
        { status: "saved", version: 3 },
      );
      expect(await service.readPublishedInvitationPhoto(db, photo)).toBeNull();
    });
    it("enforces singleton, meaningful wording and RLS at the database boundary", async () => {
      await expect(sql`update invitation_design set headline=' ' where id=1`).rejects.toMatchObject(
        { code: "23514" },
      );
      await expect(sql`update invitation_design set id=2 where id=1`).rejects.toMatchObject({
        code: "23514",
      });
      const [row] =
        await sql`select relrowsecurity from pg_class where oid='invitation_design'::regclass`;
      expect(row?.relrowsecurity).toBe(true);
    });
  },
);
