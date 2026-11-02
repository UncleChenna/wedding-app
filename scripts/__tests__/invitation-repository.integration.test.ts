import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as schema from "../../src/modules/shared/server/db/schema";
import {
  createInvitation,
  findGuestInvitation,
} from "../../src/modules/invitations/server/repository";

let sql: Sql;
const rollback = new Error("rollback fixtures");
const enabled = process.env.RUN_INVITATION_DB_TESTS === "1";

describe.runIf(enabled)("invitation persistence on isolated Postgres", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const config = readFileSync(".harness/supabase-project/supabase/config.toml", "utf8");
    const port = config
      .split("[db]\n")[1]
      ?.split("\n[")[0]
      ?.match(/^port\s*=\s*(\d+)$/m)?.[1];
    const url = new URL(process.env.DATABASE_URL ?? "");
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !port || url.port !== port)
      throw new Error("Use this worktree's isolated database only");
    sql = postgres(url.toString(), { max: 1, connect_timeout: 10 });
    await sql`select 1`;
  });
  afterAll(async () => {
    if (sql) await sql.end();
  });

  it("persists a secure draft, exposes only primary names once sent, and hides revocation", async () => {
    const db = drizzle(sql, { schema });
    try {
      await db.transaction(async (tx) => {
        const result = await createInvitation(tx, { householdName: "Test household" });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error("Expected fixture invitation");
        const { id, token } = result.value;
        expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(await findGuestInvitation(tx, token)).toBeNull();
        await tx.insert(schema.guests).values([
          { invitationId: id, name: "Primary guest", isPrimary: true, phone: "+44123456789" },
          { invitationId: id, name: "Tag along", isPrimary: false },
        ]);
        await tx
          .update(schema.invitations)
          .set({ status: "sent", notes: "private note" })
          .where(eq(schema.invitations.id, id));
        expect(await findGuestInvitation(tx, token)).toEqual({
          attendance: null,
          householdName: "Test household",
          primaryNames: ["Primary guest"],
        });
        await tx
          .update(schema.invitations)
          .set({ status: "revoked" })
          .where(eq(schema.invitations.id, id));
        expect(await findGuestInvitation(tx, token)).toBeNull();
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  });

  it("rejects invalid creation inputs and returns no result for unknown tokens", async () => {
    const db = drizzle(sql, { schema });
    expect(await createInvitation(db, { householdName: " ", maxTagAlongs: 11 })).toEqual({
      ok: false,
      code: "invalid_input",
    });
    expect(await findGuestInvitation(db, "a".repeat(43))).toBeNull();
    expect(await findGuestInvitation(db, "bad")).toBeNull();
  });
});
