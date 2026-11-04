import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import { changeInvitationLifecycle } from "../../src/modules/admin/server/invitation-lifecycle";
import type { InvitationLifecycleCommand } from "../../src/modules/admin/lib/invitation-lifecycle";
import { findGuestInvitation } from "../../src/modules/invitations/server/repository";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
const rollback = new Error("rollback lifecycle fixtures");
const actorId = randomUUID();
let client: Sql;

describe.runIf(process.env.RUN_INVITATION_LIFECYCLE_DB_TESTS === "1")(
  "invitation lifecycle on isolated PostgreSQL",
  () => {
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
      client = postgres(process.env.DATABASE_URL ?? "", { max: 4, connect_timeout: 10 });
      await client`select 1`;
    });
    afterAll(async () => {
      if (client) await client.end();
    });
    async function exercise(run: (tx: Tx) => Promise<void>) {
      try {
        await drizzle(client, { schema }).transaction(async (tx) => {
          await run(tx);
          throw rollback;
        });
      } catch (error) {
        if (error !== rollback) throw error;
      }
    }
    async function fixture(tx: Tx) {
      const [invitation] = await tx
        .insert(schema.invitations)
        .values({
          householdName: "Synthetic lifecycle test",
          status: "rsvp_yes",
          tokenVersion: 7,
        })
        .returning();
      if (!invitation) throw new Error("Missing lifecycle fixture");
      await tx
        .insert(schema.rsvps)
        .values({ invitationId: invitation.id, attending: true, countAttending: 1 });
      const command: InvitationLifecycleCommand = {
        invitationId: invitation.id,
        operation: "reissue",
        expectedStatus: "rsvp_yes",
        expectedVersion: 7,
        confirmation: "confirm",
      };
      return { invitation, command };
    }

    it("rotates the capability, rejects the old lookup and persists actor/time without capabilities", async () => {
      await exercise(async (tx) => {
        const { invitation, command } = await fixture(tx);
        const result = await changeInvitationLifecycle(tx, command, actorId);
        expect(result).toEqual({
          ok: true,
          operation: "reissue",
          status: "rsvp_yes",
          tokenVersion: 8,
        });
        const [updated] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, invitation.id));
        if (!updated) throw new Error("Missing updated invitation");
        expect(updated.token).not.toBe(invitation.token);
        expect(updated.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(await findGuestInvitation(tx, invitation.token)).toBeNull();
        expect(await findGuestInvitation(tx, updated.token)).toMatchObject({ attendance: true });
        const history = await tx
          .select()
          .from(schema.invitationLifecycleEvents)
          .where(eq(schema.invitationLifecycleEvents.invitationId, invitation.id));
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
          actorId,
          operation: "reissue",
          beforeVersion: 7,
          afterVersion: 8,
          beforeStatus: "rsvp_yes",
          afterStatus: "rsvp_yes",
        });
        expect(history[0]?.occurredAt).toBeInstanceOf(Date);
        expect(JSON.stringify(history)).not.toContain(invitation.token);
        expect(JSON.stringify(history)).not.toContain(updated.token);
      });
    });

    it("revokes online access, preserves the reply and does not double-log a stale command", async () => {
      await exercise(async (tx) => {
        const { invitation, command } = await fixture(tx);
        command.operation = "revoke";
        expect(await changeInvitationLifecycle(tx, command, actorId)).toMatchObject({
          ok: true,
          status: "revoked",
          tokenVersion: 7,
        });
        expect(await findGuestInvitation(tx, invitation.token)).toBeNull();
        expect(await changeInvitationLifecycle(tx, command, actorId)).toEqual({
          ok: false,
          code: "conflict",
        });
        const [reply] = await tx
          .select()
          .from(schema.rsvps)
          .where(eq(schema.rsvps.invitationId, invitation.id));
        expect(reply).toMatchObject({ attending: true, countAttending: 1 });
        expect(
          await tx
            .select()
            .from(schema.invitationLifecycleEvents)
            .where(eq(schema.invitationLifecycleEvents.invitationId, invitation.id)),
        ).toHaveLength(1);
      });
    });

    it("rolls the invitation back when audit insertion fails", async () => {
      await exercise(async (tx) => {
        const { invitation, command } = await fixture(tx);
        const auditUnavailable = new Error("synthetic audit write failure");
        const failingAudit: Pick<Db, "transaction"> = {
          transaction: (run) =>
            tx.transaction((inner) =>
              run(
                new Proxy(inner, {
                  get(target, property, receiver) {
                    if (property === "insert")
                      return () => {
                        throw auditUnavailable;
                      };
                    return Reflect.get(target, property, receiver);
                  },
                }),
              ),
            ),
        };
        await expect(changeInvitationLifecycle(failingAudit, command, actorId)).rejects.toThrow(
          auditUnavailable,
        );
        const [unchanged] = await tx
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, invitation.id));
        expect(unchanged).toMatchObject({
          token: invitation.token,
          tokenVersion: 7,
          status: "rsvp_yes",
        });
        expect(
          await tx
            .select()
            .from(schema.invitationLifecycleEvents)
            .where(eq(schema.invitationLifecycleEvents.invitationId, invitation.id)),
        ).toEqual([]);
      });
    });

    it("allows exactly one competing reissue and one audit event", async () => {
      const database = drizzle(client, { schema });
      const { invitation, command } = await database.transaction(fixture);
      try {
        const results = await Promise.all([
          changeInvitationLifecycle(database, command, actorId),
          changeInvitationLifecycle(database, command, randomUUID()),
        ]);
        expect(results.filter((result) => result.ok)).toHaveLength(1);
        expect(results.filter((result) => !result.ok)).toEqual([{ ok: false, code: "conflict" }]);
        const [updated] = await database
          .select()
          .from(schema.invitations)
          .where(eq(schema.invitations.id, invitation.id));
        expect(updated?.tokenVersion).toBe(8);
        expect(
          await database
            .select()
            .from(schema.invitationLifecycleEvents)
            .where(eq(schema.invitationLifecycleEvents.invitationId, invitation.id)),
        ).toHaveLength(1);
      } finally {
        // Retain audit evidence; deactivate only this test's synthetic invitation.
        await database
          .update(schema.invitations)
          .set({ status: "revoked" })
          .where(eq(schema.invitations.id, invitation.id));
      }
    });
  },
);
