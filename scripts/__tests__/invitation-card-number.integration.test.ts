import { randomBytes, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres, { type Sql } from "postgres";
import { assertDatabaseTarget } from "../database-target";

describe.skipIf(process.env.RUN_CARD_NUMBER_DB_TESTS !== "1")(
  "permanent invitation card numbers",
  () => {
    let db: Sql;
    const ids: string[] = [];
    const token = () => randomBytes(32).toString("base64url");
    async function insert() {
      const id = randomUUID();
      ids.push(id);
      const [row] = await db<{ id: string; card_number: number }[]>`
      insert into invitations (id, token) values (${id}, ${token()}) returning id, card_number`;
      if (!row) throw new Error("Missing synthetic invitation");
      return row;
    }
    beforeAll(() => {
      assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
      db = postgres(process.env.DATABASE_URL ?? "", { max: 4 });
    });
    afterAll(async () => {
      if (!db) return;
      try {
        if (ids.length) await db`delete from invitations where id in ${db(ids)}`;
      } finally {
        await db.end();
      }
    });
    it("allocates positive distinct numbers for concurrent invitations", async () => {
      const rows = await Promise.all(Array.from({ length: 8 }, insert));
      expect(new Set(rows.map((row) => row.card_number)).size).toBe(8);
      expect(rows.every((row) => Number.isInteger(row.card_number) && row.card_number > 0)).toBe(
        true,
      );
    });
    it("preserves numbers when tokens are reissued and other invitations are deleted", async () => {
      const first = await insert();
      const second = await insert();
      await db`update invitations set token=${token()}, token_version=token_version+1 where id=${second.id}`;
      await db`delete from invitations where id=${first.id}`;
      const [saved] = await db`select card_number from invitations where id=${second.id}`;
      expect(saved?.card_number).toBe(second.card_number);
      const next = await insert();
      expect(next.card_number).toBeGreaterThan(second.card_number);
    });
    it("rejects caller-supplied numbers rather than replacing an existing card", async () => {
      const existing = await insert();
      await expect(
        db`insert into invitations (token, card_number) values (${token()}, ${existing.card_number})`,
      ).rejects.toMatchObject({ code: "428C9" });
    });
    it("retains unique and positive constraints even for privileged identity overrides", async () => {
      const existing = await insert();
      await expect(
        db`insert into invitations (token, card_number) overriding system value values (${token()}, ${existing.card_number})`,
      ).rejects.toMatchObject({ code: "23505" });
      await expect(
        db`insert into invitations (token, card_number) overriding system value values (${token()}, 0)`,
      ).rejects.toMatchObject({ code: "23514" });
    });
  },
);
