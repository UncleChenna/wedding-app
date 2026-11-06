# TICKET-088 handoff

- **2026-11-04 (unclechenna, claude):** admin shell in place.
  - Add a section by appending to `adminSections` in `src/modules/admin/components/admin-shell.tsx` and registering its
    route in `src/modules/shared/lib/routes.ts`. The bottom bar shows three columns, so with four or more sections,
    rebalance the grid or group items.
  - Page content goes inside `<main>`; the shell provides the event name and sign-out.
  - `/dev/admin` previews the shell without sign-in.
  - **Next admin tickets:** menu editor (095), event settings (101), staff and PINs (096), and the ordering on/off
    switch (080, which needs 088).
