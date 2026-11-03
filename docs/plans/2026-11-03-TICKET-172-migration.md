# TICKET-172 authorized migration

Integrate develop 0e6247c630c4d8962eb01b3c8bc2ef0817268e47, preserving ordering seeds and staff/device fixtures. User approved generation, isolated testing, commit and exact-path authorization, including unchanged develop files.

Generate 0009 through Drizzle. Inspect SQL; prove nullable staff email, complete encoded PIN fields, positive credential version, device constraints and RLS. Preserve existing identities and scans across migration; migrate twice and compare counts. Run deterministic seed checks and full verification. No production changes or real credentials. Keep TICKET-031 responsible for login and TICKET-096 for admin provisioning.
