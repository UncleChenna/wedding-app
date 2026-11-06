import { randomInt, randomUUID } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertDatabaseTarget } from "../database-target";
import * as schema from "../../src/modules/shared/server/db/schema";
import type { Db } from "../../src/modules/shared/server/db/client";
import type * as Repository from "../../src/modules/admin/server/memories-repository";

describe.runIf(process.env.RUN_MEMORIES_DB_TESTS === "1")("anonymous memories query", () => {
  let sql: Sql;
  let database: Db;
  let readMemories: typeof Repository.readMemories;
  const invitation = randomUUID(),
    guest = randomUUID(),
    table = randomUUID();
  const meal = randomUUID(),
    unused = randomUUID();
  const served = randomUUID(),
    cancelled = randomUUID();
  const servedStation = randomUUID(),
    cancelledStation = randomUUID();
  const menuName = `Memories fixture ${meal}`;
  beforeAll(async () => {
    process.loadEnvFile(".env.local");
    const url = process.env.DATABASE_URL ?? "";
    assertDatabaseTarget(url, { localOnly: true });
    sql = postgres(url, { max: 2, connect_timeout: 10 });
    database = drizzle(sql, { schema });
    ({ readMemories } = await import("../../src/modules/admin/server/memories-repository"));
  });
  afterAll(async () => {
    if (!sql) return;
    try {
      await sql`delete from invitations where id=${invitation}`;
      await sql`delete from orders where id in (${served}, ${cancelled})`;
      await sql`delete from menu_items where id in (${meal}, ${unused})`;
      await sql`delete from tables where id=${table}`;
    } finally {
      await sql.end();
    }
  });
  it("counts household replies and admissions without duplication, excludes cancelled quantities and personal notes", async () => {
    const baseline = await readMemories(database);
    await sql.begin(async (tx) => {
      await tx`insert into invitations(id,token) values (${invitation}, ${randomUUID().replaceAll("-", "")})`;
      await tx`insert into rsvps(invitation_id,attending,count_attending,message) values (${invitation}, true, 5, 'PRIVATE RSVP')`;
      await tx`insert into guests(id,invitation_id,name,email,dietary_notes) values (${guest},${invitation},'PRIVATE NAME','private@example.test','PRIVATE DIET')`;
      await tx`insert into check_ins(guest_id,checked_in_at,client_event_id) values (${guest},now(),${randomUUID()})`;
      await tx`insert into tables(id,number,capacity) values (${table},${randomInt(100000, 2000000000)},10)`;
      await tx`insert into menu_items(id,name,category_v2,station) values (${meal},${menuName},'meal','kitchen'),(${unused},${menuName + " unused"},'meal','kitchen')`;
      await tx`insert into orders(id,table_id,guest_name,notes) values (${served},${table},'PRIVATE NAME','PRIVATE ORDER'),(${cancelled},${table},'PRIVATE NAME','PRIVATE ORDER')`;
      await tx`insert into station_orders(id,order_id,station,status) values (${servedStation},${served},'kitchen','served'),(${cancelledStation},${cancelled},'kitchen','cancelled')`;
      await tx`insert into order_items(order_id,station_order_id,menu_item_id,quantity,notes) values (${served},${servedStation},${meal},2,'PRIVATE ITEM'),(${cancelled},${cancelledStation},${meal},3,'PRIVATE ITEM')`;
    });
    const result = await readMemories(database);
    expect(result.invitations).toBe(baseline.invitations + 1);
    expect(result.repliedYes).toBe(baseline.repliedYes + 1);
    expect(result.repliedNo).toBe(baseline.repliedNo);
    expect(result.attending).toBe(baseline.attending + 5);
    expect(result.admissions).toBe(baseline.admissions + 1);
    expect(result.menu.find((item) => item.name === menuName)).toEqual({
      name: menuName,
      ordered: 2,
      served: 2,
    });
    expect(result.menu.find((item) => item.name === menuName + " unused")).toEqual({
      name: menuName + " unused",
      ordered: 0,
      served: 0,
    });
    expect(JSON.stringify(result)).not.toMatch(/PRIVATE|private@example/);
  });
});
