import type { Sql } from "postgres";

/**
 * Guest ordering is closed by default (ORD-7, TICKET-080). Tests that show the menu or place
 * orders set it explicitly and put the previous value back afterwards.
 */
export async function setOrderingOpen(db: Sql, open: boolean): Promise<() => Promise<void>> {
  const [row] = await db<
    { open: boolean }[]
  >`select ordering_open as open from event_settings where id = 1`;
  await db`insert into event_settings (id, ordering_open) values (1, ${open})
    on conflict (id) do update set ordering_open = ${open}`;
  const previous = row?.open;
  return async () => {
    if (previous === undefined)
      await db`update event_settings set ordering_open = false where id = 1`;
    else await db`update event_settings set ordering_open = ${previous} where id = 1`;
  };
}
