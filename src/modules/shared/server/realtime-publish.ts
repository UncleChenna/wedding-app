import "server-only";
import { sql } from "drizzle-orm";
import type { Db } from "./db/client";
import {
  stationEvents,
  stationTopic,
  type Station,
  type StationEvent,
  type StationPayload,
} from "../lib/realtime-channels";

type Executor = Pick<Db, "execute">;

let available: Promise<boolean> | undefined;

/** Plain Postgres (CI) has no Realtime; there, publishing is a no-op. */
function realtimeAvailable(database: Executor): Promise<boolean> {
  available ??= database
    .execute<{ ok: boolean }>(
      sql`select to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null as ok`,
    )
    .then((rows) => rows[0]?.ok === true)
    .catch(() => {
      available = undefined;
      return false;
    });
  return available;
}

/**
 * Publishes one notification to a station's private topic (ADR 0024). Call it inside the write's
 * transaction: `realtime.send` stores the message in `realtime.messages`, so it's delivered only
 * if the write commits, and a rollback publishes nothing. The payload is checked against the
 * station's contract first, so a private field can't be sent by mistake.
 */
export async function publishToStation<S extends Station, E extends StationEvent<S>>(
  database: Executor,
  station: S,
  event: E,
  payload: StationPayload<S, E>,
): Promise<void> {
  const events: Record<string, { parse: (value: unknown) => unknown }> = stationEvents[station];
  const schema = events[event];
  if (!schema) throw new Error(`Unknown ${station} event ${event}`);
  const message = schema.parse(payload);
  if (!(await realtimeAvailable(database))) return;
  await database.execute(
    sql`select realtime.send(${JSON.stringify(message)}::jsonb, ${event}, ${stationTopic(station)}, true)`,
  );
}
