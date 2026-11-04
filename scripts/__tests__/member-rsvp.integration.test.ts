import { randomBytes, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { saveMemberRsvp } from "../../src/modules/invitations/server/save-member-rsvp";

describe.runIf(process.env.RUN_MEMBER_RSVP_DB_TESTS === "1")(
  "member responses in isolated Postgres",
  () => {
    let client: Sql;
    let save: typeof saveMemberRsvp;
    const fixtureIds: string[] = [];
    beforeAll(async () => {
      process.loadEnvFile(".env.local");
      assertDatabaseTarget(process.env.DATABASE_URL ?? "", { localOnly: true });
      client = postgres(process.env.DATABASE_URL ?? "", { max: 4 });
      save = (await import("../../src/modules/invitations/server/save-member-rsvp")).saveMemberRsvp;
      const settings = await client`select venue from event_settings where id=1`;
      if (settings.length && settings[0]?.venue !== "TICKET211 isolation")
        throw new Error("Use an empty disposable worktree database for this suite");
      await client`insert into event_settings(id, time_zone, venue) values(1,'Etc/UTC','TICKET211 isolation') on conflict(id) do nothing`;
    });
    afterAll(async () => {
      if (!client) return;
      if (fixtureIds.length)
        await client.begin(async (tx) => {
          // Only this suite's disposable fixtures; never a production history operation.
          await tx`alter table rsvp_changes disable trigger rsvp_history_append_only`;
          await tx`delete from rsvp_changes where invitation_id in ${tx(fixtureIds)}`;
          await tx`delete from invitations where id in ${tx(fixtureIds)}`;
          await tx`alter table rsvp_changes enable trigger rsvp_history_append_only`;
        });
      await client`delete from event_settings where venue='TICKET211 isolation'`;
      await client.end();
    });
    async function fixture(kind: "individual" | "family" | "group" = "family") {
      const token = randomBytes(32).toString("base64url");
      const [invitation] = await client<
        { id: string }[]
      >`insert into invitations(token,status,kind) values(${token},'sent',${kind}) returning id`;
      if (!invitation) throw new Error("Missing fixture");
      fixtureIds.push(invitation.id);
      const count = kind === "individual" ? 1 : 3;
      const ids: string[] = [];
      for (let i = 0; i < count; i++) {
        const [person] = await client<
          { id: string }[]
        >`insert into guests(invitation_id,name,email,age_band,is_primary) values(${invitation.id},${"Synthetic member " + i},'shared@example.test',${i === 2 ? "child" : "adult"},${i === 0}) returning id`;
        if (!person) throw new Error("Missing member");
        ids.push(person.id);
      }
      return { ...invitation, token, ids };
    }
    function request(ids: string[], revision = 0) {
      return {
        expectedRevision: revision,
        requestId: randomUUID(),
        members: ids.map((guestId, index) => ({
          guestId,
          attendance: index === 1 ? "no" : "yes",
          dietaryNotes: index === 2 ? "Synthetic dairy note" : "",
        })),
      };
    }
    it.each(["individual", "family", "group"] as const)(
      "persists distinct %s members, mixed attendance and dietary notes",
      async (kind) => {
        const f = await fixture(kind);
        const result = await save(drizzle(client, { schema }), f.token, request(f.ids));
        expect(result).toMatchObject({
          ok: true,
          revision: 1,
          countAttending: kind === "individual" ? 1 : 2,
        });
        expect(await client`select * from member_rsvps where invitation_id=${f.id}`).toHaveLength(
          f.ids.length,
        );
        const [count] = await client`select count_attending from rsvps where invitation_id=${f.id}`;
        expect(count?.count_attending).toBe(kind === "individual" ? 1 : 2);
        const changes =
          await client`select before,after,actor from rsvp_changes where invitation_id=${f.id}`;
        expect(changes).toHaveLength(1);
        expect(changes[0]?.after.members).toHaveLength(f.ids.length);
        expect(new Set(f.ids).size).toBe(f.ids.length); // Shared contact never merges members.
      },
    );
    it("replays a completed request and rejects reuse for different content", async () => {
      const f = await fixture();
      const db = drizzle(client, { schema });
      const input = request(f.ids);
      expect(await save(db, f.token, input)).toMatchObject({
        ok: true,
        revision: 1,
        replayed: false,
      });
      expect(await save(db, f.token, input)).toMatchObject({
        ok: true,
        revision: 1,
        replayed: true,
      });
      expect(await save(db, f.token, { ...input, expectedRevision: 1 })).toEqual({
        ok: false,
        code: "request-conflict",
      });
      expect(await client`select id from rsvp_changes where invitation_id=${f.id}`).toHaveLength(1);
    });
    it("permits exactly one concurrent edit at the same revision", async () => {
      const f = await fixture();
      const db = drizzle(client, { schema });
      const results = await Promise.all([
        save(db, f.token, request(f.ids)),
        save(db, f.token, request(f.ids)),
      ]);
      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.filter((result) => !result.ok && result.code === "conflict")).toHaveLength(1);
      expect(await client`select id from rsvp_changes where invitation_id=${f.id}`).toHaveLength(1);
    });
    it("accepts concurrent retries once and returns the same committed outcome", async () => {
      const f = await fixture();
      const db = drizzle(client, { schema });
      const input = request(f.ids);
      const results = await Promise.all([save(db, f.token, input), save(db, f.token, input)]);
      expect(results.every((result) => result.ok)).toBe(true);
      expect(results.filter((result) => result.ok && result.replayed)).toHaveLength(1);
      expect(await client`select id from rsvp_receipts where invitation_id=${f.id}`).toHaveLength(
        1,
      );
      expect(await client`select id from rsvp_changes where invitation_id=${f.id}`).toHaveLength(1);
    });
    it("denies other households and revoked links without a partial update", async () => {
      const first = await fixture();
      const other = await fixture();
      const db = drizzle(client, { schema });
      expect(await save(db, first.token, request(other.ids))).toEqual({
        ok: false,
        code: "unavailable",
      });
      expect(await client`select id from rsvps where invitation_id=${first.id}`).toHaveLength(0);
      await client`update invitations set status='revoked' where id=${first.id}`;
      expect(await save(db, first.token, request(first.ids))).toEqual({
        ok: false,
        code: "unavailable",
      });
    });
    it("locks at the deadline, supports household reopening, and preserves partial-answer state", async () => {
      const f = await fixture();
      const db = drizzle(client, { schema });
      const now = new Date("2026-12-19T00:00:00Z");
      await client`update event_settings set rsvp_lock_at=${now.toISOString()} where id=1`;
      try {
        expect(await save(db, f.token, request(f.ids), { now })).toEqual({
          ok: false,
          code: "locked",
        });
        await client`update invitations set rsvp_reopen_until=${new Date(now.getTime() + 1000).toISOString()} where id=${f.id}`;
        expect(await save(db, f.token, request(f.ids.slice(0, 1)), { now })).toMatchObject({
          ok: true,
          countAttending: 1,
        });
        const remaining = request(f.ids.slice(1, 2), 1);
        expect(await save(db, f.token, remaining, { now })).toMatchObject({
          ok: true,
          countAttending: 2,
        });
        const rows = await client`select attendance from member_rsvps where invitation_id=${f.id}`;
        expect(rows.filter((row) => row.attendance === "pending")).toHaveLength(1);
      } finally {
        await client`update event_settings set rsvp_lock_at=null where id=1`;
      }
    });
    it("enforces person uniqueness and household membership in the database", async () => {
      const f = await fixture();
      const other = await fixture();
      const firstMember = f.ids[0];
      if (!firstMember) throw new Error("Missing fixture member");
      await expect(
        client`insert into member_rsvps(guest_id,invitation_id) values(${firstMember},${other.id})`,
      ).rejects.toMatchObject({ code: "23503" });
      await client`insert into member_rsvps(guest_id,invitation_id) values(${firstMember},${f.id})`;
      await expect(
        client`insert into member_rsvps(guest_id,invitation_id) values(${firstMember},${f.id})`,
      ).rejects.toMatchObject({ code: "23505" });
    });
  },
);
