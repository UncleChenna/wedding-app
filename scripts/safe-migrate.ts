import { randomBytes } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import type { Sql } from "postgres";
import { z } from "zod";
import * as schema from "../src/modules/shared/server/db/schema";

export class SafeMigrationError extends Error {}
const stamp = z.coerce.date();
const originalInvitation = z
  .object({
    id: z.uuid(),
    code: z.string(),
    household_name: z.string(),
    max_guests: z.number().int().positive(),
    notes: z.string().nullable(),
    sent_at: stamp.nullable(),
    created_at: stamp,
    updated_at: stamp,
  })
  .passthrough();
const originalGuest = z
  .object({
    id: z.uuid(),
    invitation_id: z.uuid(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    is_primary: z.boolean(),
    dietary_requirements: z.string().nullable(),
    table_id: z.uuid().nullable(),
    created_at: stamp,
    updated_at: stamp,
  })
  .passthrough();
const originalRsvp = z
  .object({
    id: z.uuid(),
    invitation_id: z.uuid(),
    status: z.enum(["pending", "attending", "declined"]),
    message: z.string().nullable(),
    responded_at: stamp.nullable(),
    created_at: stamp,
    updated_at: stamp,
  })
  .passthrough();
const originalCheckIn = z
  .object({
    id: z.uuid(),
    guest_id: z.uuid(),
    staff_id: z.uuid().nullable(),
    checked_in_at: stamp,
    device_id: z.string().nullable(),
    client_event_id: z.uuid(),
    created_at: stamp,
  })
  .passthrough();
const strongToken = /^[A-Za-z0-9_-]{22,128}$/;
function internationalPhone(value: string | null): string | null {
  if (value === null) return null;
  // Never infer a country from the developer's locale or silently strip letters/extensions.
  if (!/^\+[0-9 ()-]+$/.test(value))
    throw new SafeMigrationError(
      "Legacy phone data requires reviewed correction before upgrade; no country code was guessed.",
    );
  const phone = value.replace(/[ ()-]/g, "");
  if (!/^\+[1-9][0-9]{1,14}$/.test(phone))
    throw new SafeMigrationError("Legacy phone data requires reviewed correction before upgrade.");
  return phone;
}

export type MigrationOptions = {
  migrationsFolder: string;
  upgradeLegacy?: boolean;
  allowLegacyTokenReissue?: boolean;
};

/**
 * Ordinary installs use Drizzle unchanged. A populated 0000 upgrade uses one locked
 * transaction: snapshot -> empty only affected tables -> execute ALL unchanged pending
 * migration SQL -> restore converted identities -> restricted lossless archive -> commit.
 * A failure rolls back both schema/data and Drizzle journal rows. No committed SQL is rewritten.
 */
export async function runSafeMigrations(client: Sql, options: MigrationOptions) {
  const database = drizzle(client, { schema });
  const legacy = await database.execute(
    sql`select 1 from information_schema.columns where table_schema='public' and table_name='guests' and column_name='first_name'`,
  );
  if (!legacy.length) {
    await migrate(database, options);
    return { legacyUpgraded: false, reissuedTokens: 0 };
  }
  if (!options.upgradeLegacy)
    throw new SafeMigrationError(
      "Legacy upgrade requires --upgrade-legacy after an isolated restore rehearsal and verified backup; no changes made.",
    );
  const migrations = readMigrationFiles(options);
  const bootstrap = migrations[0];
  if (!bootstrap) throw new SafeMigrationError("Bootstrap migration is missing.");
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(2110001)`);
    // No CASCADE: unknown referencing tables must fail closed rather than be emptied.
    await tx.execute(
      sql`lock table public.invitations, public.guests, public.rsvps, public.check_ins in access exclusive mode`,
    );
    const journal = await tx.execute<{ hash: string; created_at: string }>(
      sql`select hash,created_at from drizzle.__drizzle_migrations order by created_at`,
    );
    if (
      journal.length !== 1 ||
      journal[0]?.hash !== bootstrap.hash ||
      Number(journal[0]?.created_at) !== bootstrap.folderMillis
    )
      throw new SafeMigrationError(
        "Legacy schema/journal is not the verified 0000 bootstrap. Review this database before upgrade.",
      );
    const oldInvitations = originalInvitation
      .array()
      .parse(await tx.execute(sql`select * from public.invitations`));
    const oldGuests = originalGuest
      .array()
      .parse(await tx.execute(sql`select * from public.guests`));
    const oldRsvps = originalRsvp.array().parse(await tx.execute(sql`select * from public.rsvps`));
    const oldCheckIns = originalCheckIn
      .array()
      .parse(await tx.execute(sql`select * from public.check_ins`));
    // Keep the original database representation too: JS Date would lose microseconds.
    const originalRecords = await tx.execute<{
      source_table: "invitations" | "guests" | "rsvps" | "check_ins";
      source_id: string;
      record: Record<string, unknown>;
    }>(sql`
      select 'invitations' as source_table,id as source_id,to_jsonb(i) as record from public.invitations i
      union all select 'guests',id,to_jsonb(g) from public.guests g
      union all select 'rsvps',id,to_jsonb(r) from public.rsvps r
      union all select 'check_ins',id,to_jsonb(c) from public.check_ins c
    `);
    const reissuedTokens = oldInvitations.filter(
      (invitation) => !strongToken.test(invitation.code),
    ).length;
    if (reissuedTokens && !options.allowLegacyTokenReissue)
      throw new SafeMigrationError(
        "Legacy codes require explicit --allow-legacy-token-reissue. Originals will be archived; new private links must be reviewed and redistributed.",
      );
    for (const invitation of oldInvitations) {
      const people = oldGuests.filter((person) => person.invitation_id === invitation.id);
      if (people.length > invitation.max_guests)
        throw new SafeMigrationError(
          "Legacy named people exceed the recorded allowance. Review the conflict before upgrade.",
        );
      if (
        !people.length &&
        oldRsvps.some(
          (response) => response.invitation_id === invitation.id && response.status === "attending",
        )
      )
        throw new SafeMigrationError(
          "An attending legacy invitation has no named people. Review it before upgrade.",
        );
    }
    for (const person of oldGuests) {
      if (!(person.first_name + " " + person.last_name).trim())
        throw new SafeMigrationError("A legacy person has no name. Review it before upgrade.");
      internationalPhone(person.phone);
    }
    await tx.execute(
      sql`truncate public.check_ins, public.rsvps, public.guests, public.invitations`,
    );
    for (const migration of migrations.slice(1)) {
      for (const statement of migration.sql) await tx.execute(sql.raw(statement));
      await tx.execute(
        sql`insert into drizzle.__drizzle_migrations(hash,created_at) values(${migration.hash},${migration.folderMillis})`,
      );
    }
    for (const old of oldInvitations) {
      const response = oldRsvps.find((response) => response.invitation_id === old.id);
      const people = oldGuests.filter((person) => person.invitation_id === old.id);
      await tx.insert(schema.invitations).values({
        id: old.id,
        token: strongToken.test(old.code) ? old.code : randomBytes(32).toString("base64url"),
        householdName: old.household_name,
        maxTagAlongs: Math.max(0, old.max_guests - 1),
        kind: people.length > 1 ? "group" : "individual",
        status:
          response?.status === "attending"
            ? "rsvp_yes"
            : response?.status === "declined"
              ? "rsvp_no"
              : old.sent_at
                ? "sent"
                : "draft",
        notes: old.notes,
        sentAt: old.sent_at,
        createdAt: old.created_at,
        updatedAt: old.updated_at,
      });
    }
    for (const old of oldGuests)
      await tx.insert(schema.guests).values({
        id: old.id,
        invitationId: old.invitation_id,
        name: (old.first_name + " " + old.last_name).trim(),
        email: old.email,
        phone: internationalPhone(old.phone),
        isPrimary: old.is_primary,
        dietaryNotes: old.dietary_requirements,
        tableId: old.table_id,
        createdAt: old.created_at,
        updatedAt: old.updated_at,
      });
    for (const old of oldRsvps) {
      if (old.status === "pending") continue; // Pending is a real member state, not a false RSVP.
      const count = oldGuests.filter((person) => person.invitation_id === old.invitation_id).length;
      await tx.insert(schema.rsvps).values({
        id: old.id,
        invitationId: old.invitation_id,
        attending: old.status === "attending",
        countAttending: old.status === "attending" ? count : 0,
        message: old.message,
        respondedAt: old.responded_at ?? old.updated_at,
        createdAt: old.created_at,
        updatedAt: old.updated_at,
      });
    }
    for (const old of oldCheckIns)
      await tx.insert(schema.checkIns).values({
        id: old.id,
        guestId: old.guest_id,
        staffId: old.staff_id,
        checkedInAt: old.checked_in_at,
        deviceId: old.device_id,
        clientEventId: old.client_event_id,
        createdAt: old.created_at,
      });
    for (const row of originalRecords)
      await tx.insert(schema.legacyMigrationRecords).values({
        sourceTable: row.source_table,
        sourceId: row.source_id,
        record: row.record,
      });
    // Restore source precision in operational rows after the typed conversion.
    await tx.execute(sql`
      update public.invitations i set created_at=(a.record->>'created_at')::timestamptz,
        updated_at=(a.record->>'updated_at')::timestamptz,sent_at=(a.record->>'sent_at')::timestamptz
      from public.legacy_migration_records a where a.source_table='invitations' and a.source_id=i.id
    `);
    await tx.execute(sql`
      update public.guests g set created_at=(a.record->>'created_at')::timestamptz,
        updated_at=(a.record->>'updated_at')::timestamptz
      from public.legacy_migration_records a where a.source_table='guests' and a.source_id=g.id
    `);
    await tx.execute(sql`
      update public.rsvps r set created_at=(a.record->>'created_at')::timestamptz,
        updated_at=(a.record->>'updated_at')::timestamptz,
        responded_at=coalesce(a.record->>'responded_at',a.record->>'updated_at')::timestamptz
      from public.legacy_migration_records a where a.source_table='rsvps' and a.source_id=r.id
    `);
    await tx.execute(sql`
      update public.check_ins c set created_at=(a.record->>'created_at')::timestamptz,
        checked_in_at=(a.record->>'checked_in_at')::timestamptz
      from public.legacy_migration_records a where a.source_table='check_ins' and a.source_id=c.id
    `);
    // The backfill migration ran while the affected tables were empty; now materialize them.
    await tx.execute(
      sql`insert into public.member_rsvps(guest_id,invitation_id,attendance,responded_at) select g.id,g.invitation_id,case when r.id is null then 'pending' when r.attending then 'yes' else 'no' end,case when r.id is null then null else r.responded_at end from public.guests g left join public.rsvps r on r.invitation_id=g.invitation_id on conflict(guest_id) do nothing`,
    );
    return { legacyUpgraded: true, reissuedTokens };
  });
}
