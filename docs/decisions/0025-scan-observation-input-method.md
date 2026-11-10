# 0025 — Scan observation input method is separate from transport

- Status: Accepted · 2026-11-09 (TICKET-062)

The scan event `source` describes online, offline or historical transport and participates in admission replay. It must not be repurposed to mean manual lookup. A nullable `input_method` records `qr` or `manual`; existing historical events remain unknown rather than receiving invented provenance.

An authenticated online pass check writes an immutable observation with zero reported/admitted people. It does not allocate a place, update the canonical counter or appear in accepted-arrival history. An explicit admission remains a separate event with its existing exact-request replay semantics.

Only server code derives staff/device from the live signed session and resolves invitation identity after signature verification. Unknown or malformed passes record the existing invalid vocabulary with no invitation FK; replaced passes use revoked. Technical storage/session failures are not reclassified as guest verdicts. Manual lookup uses the server-only observation contract after resolving a guest; public scan request JSON cannot choose a method, actor, source or count.

Browser-reported time is untrusted evidence, limited to the preceding24hours or next5minutes. The database receipt timestamp is authoritative. Old clients without a reported time use server observation time. Logs contain no raw PIN, pass token, guest name, email or dietary note. Existing no-policy RLS continues to deny browser table reads. No policy or production database change is authorized by this ADR.
