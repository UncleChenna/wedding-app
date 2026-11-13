# TICKET-238 handoff

2026-11-13 — divine/codex — TICKET-238, base fe97f5f8.

New unit proves three read requests were issued for repeated callbacks while one response was pending. Scanner.check now returns while its read controller exists. Explicit pause/start/unmount still abort and clear the controller; stale results stay fenced. All16 scanner/live-update units pass; production build passes.

Native disposable PostgreSQL: /tmp/TICKET-238-native-pg, port35621, managed ticket identity wedding-f15466622397. Migrations applied successfully. No full Supabase stack is started. The actual signed-camera matrix delays the first logged read response by4seconds and retains exact-one observation/no-admission assertions; both mobile/desktop cases pass in18.0s, recorded in /tmp/TICKET-238-browser.log. Screenshots go to ignored artifacts/TICKET-238, preserving older reviewed files.

Next: finish actual browser evidence and independent review, publish PR, normal quick/CI gates, verified merge, CLI completion. Stop only this native instance afterward, preserving its files.
