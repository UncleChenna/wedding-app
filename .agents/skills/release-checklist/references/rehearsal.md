# Wedding-day rehearsal

Use fake guests and an isolated staging/local database. Obtain explicit permission before backing up live guest data; store encrypted backups outside Git and logs.

- Record the release SHA, event date, named go/no-go owner, device inventory, and recovery contact.
- Run `pnpm verify` and the UI checklist. Confirm invitation and table QR links point to the intended environment.
- On both gate devices, preload the guest data, disconnect all networking, scan valid/invalid/already-used QR codes, restart the browser, then reconnect. Confirm queued scans survive and each guest has exactly one check-in after repeated sync. Test two devices scanning the same guest offline and verify the documented conflict response.
- In staging, simulate 300 concurrent guest sessions for 10 minutes plus gate and kitchen/bar clients. Record throughput, p95 latency, errors, duplicate orders, and update lag. Agree acceptance budgets with both developers before the run; do not invent a passed target after measuring.
- Create a database backup, restore to a separate disposable database, compare row counts and key relationships, and rehearse rollback of the app release. Record restore duration and who can perform it.
- Check camera/audio permissions, reduced motion, low battery, weak Wi-Fi/mobile fallback, menu availability, seating, time zone, privacy, and staff login/recovery.
- Print a guest list and establish a manual check-in/ordering fallback. Brief staff on duplicate scans and recovery.
- Report PASS / FAIL / not verified for each check. Missing features, failed restore, lost offline scans, or untested critical devices mean NO-GO.
