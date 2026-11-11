/** Called only inside the local-only seed transaction after target validation. */
export async function resetSeedTables(execute: (statement: string) => Promise<unknown>) {
  // Named exceptions only. PostgreSQL rolls these changes back if the transaction fails.
  const guards = [
    ["rsvp_changes", "rsvp_history_append_only"],
    ["scan_events", "scan_events_append_only"],
    ["scan_resolution_notes", "scan_resolution_notes_append_only"],
    ["admission_counters", "admission_counters_no_removal"],
    ["rsvps", "rsvp_admission_no_truncate"],
    ["guests", "guest_admission_no_truncate"],
  ] as const;
  for (const [table, trigger] of guards) {
    await execute(`alter table ${table} disable trigger ${trigger}`);
  }
  await execute(`truncate table guest_import_batches, scan_events, admission_counters, rsvp_changes, event_settings,
    order_items, station_orders, orders, menu_items, check_ins, rsvps, guests, tables,
    invitations, registered_devices, staff, themes restart identity cascade`);
  // Restore before any fixtures are inserted; normal application writes keep every guard.
  for (const [table, trigger] of guards) {
    await execute(`alter table ${table} enable trigger ${trigger}`);
  }
}
