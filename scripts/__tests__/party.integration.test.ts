import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres, { type Sql } from "postgres";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type * as party from "../../src/modules/invitations/server/party";
let sql: Sql;
let api: typeof party;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback isolated party fixtures");
describe.runIf(process.env.RUN_PARTY_DB_TESTS === "1")("party persistence", () => {
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
    sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
    api = await import("../../src/modules/invitations/server/party");
  });
  afterAll(async () => {
    if (sql) await sql.end();
  });
  async function exercise(run: (tx: Tx) => Promise<void>) {
    try {
      await drizzle(sql, { schema }).transaction(async (tx) => {
        await run(tx);
        throw rollback;
      });
    } catch (error) {
      if (error !== rollback) throw error;
    }
  }
  async function fixture(tx: Tx) {
    await tx
      .insert(schema.eventSettings)
      .values({ id: 1, timeZone: "Etc/UTC" })
      .onConflictDoUpdate({ target: schema.eventSettings.id, set: { timeZone: "Etc/UTC" } });
    const [invitation] = await tx
      .insert(schema.invitations)
      .values({ status: "rsvp_yes", maxTagAlongs: 2 })
      .returning();
    if (!invitation) throw new Error("Missing invitation fixture");
    const [guest] = await tx
      .insert(schema.guests)
      .values({
        invitationId: invitation.id,
        name: "Ada",
        isPrimary: true,
        email: "party@example.test",
      })
      .returning();
    const [meal] = await tx
      .insert(schema.menuItems)
      .values({ name: "Test rice", category: "meal", station: "kitchen" })
      .returning();
    if (!guest || !meal) throw new Error("Missing party fixture");
    const person = { id: guest.id, name: guest.name, mealChoice: meal.id, dietaryNotes: "No nuts" };
    return { invitation, guest, meal, person };
  }
  it("saves two tag-alongs, edits and removes one, and derives the reloaded count", async () => {
    await exercise(async (tx) => {
      const { invitation, person } = await fixture(tx);
      expect(
        await api.saveParty(tx, invitation.token, [
          person,
          { ...person, id: "", name: "Uche" },
          { ...person, id: "", name: "Obi" },
        ]),
      ).toMatchObject({ status: "saved" });
      const first = await api.readParty(tx, invitation.token);
      expect(first?.people).toHaveLength(3);
      expect(
        first?.people.every(
          (row) => row.dietaryNotes === "No nuts" && row.mealChoice === person.mealChoice,
        ),
      ).toBe(true);
      const retained = first?.people
        .filter((row) => row.name !== "Obi")
        .map(({ id, name, mealChoice, dietaryNotes }) => ({
          id,
          name,
          mealChoice,
          dietaryNotes: name === "Uche" ? "Vegetarian" : dietaryNotes,
        }));
      expect(await api.saveParty(tx, invitation.token, retained)).toMatchObject({
        status: "saved",
      });
      const reloaded = await api.readParty(tx, invitation.token);
      expect(reloaded?.people).toHaveLength(2);
      expect(reloaded?.people.find((row) => row.name === "Uche")?.dietaryNotes).toBe("Vegetarian");
      const [rsvp] = await tx
        .select()
        .from(schema.rsvps)
        .where(eq(schema.rsvps.invitationId, invitation.id));
      expect(rsvp?.countAttending).toBe(2);
      const [primary] = await tx
        .select()
        .from(schema.guests)
        .where(eq(schema.guests.id, person.id));
      expect(primary?.email).toBe("party@example.test");
    });
  });
  it("rejects an over-limit submission without changing guests or RSVP", async () => {
    await exercise(async (tx) => {
      const { invitation, person } = await fixture(tx);
      const extras = Array.from({ length: 3 }, (_, index) => ({
        ...person,
        id: "",
        name: "Guest " + index,
      }));
      expect(await api.saveParty(tx, invitation.token, [person, ...extras])).toMatchObject({
        status: "error",
      });
      expect((await api.readParty(tx, invitation.token))?.people).toHaveLength(1);
      expect(
        await tx.select().from(schema.rsvps).where(eq(schema.rsvps.invitationId, invitation.id)),
      ).toHaveLength(0);
    });
  });
  it.each(["draft", "revoked", "rsvp_no"] as const)("rejects %s at write time", async (status) => {
    await exercise(async (tx) => {
      const { invitation, person } = await fixture(tx);
      await tx
        .update(schema.invitations)
        .set({ status })
        .where(eq(schema.invitations.id, invitation.id));
      expect(await api.saveParty(tx, invitation.token, [person])).toMatchObject({
        status: "error",
      });
      const [guest] = await tx.select().from(schema.guests).where(eq(schema.guests.id, person.id));
      expect(guest?.dietaryNotes).toBeNull();
    });
  });
  it("rejects an unavailable meal and a guest ID from another invitation", async () => {
    await exercise(async (tx) => {
      const { invitation, person, meal } = await fixture(tx);
      await tx
        .update(schema.menuItems)
        .set({ isAvailable: false })
        .where(eq(schema.menuItems.id, meal.id));
      expect(await api.saveParty(tx, invitation.token, [person])).toMatchObject({
        status: "error",
      });
      const other = await fixture(tx);
      expect(await api.saveParty(tx, invitation.token, [person, other.person])).toMatchObject({
        status: "error",
      });
    });
  });
});
