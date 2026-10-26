# Frontend delivery order

User priority, 26 October 2026: visible, navigable pages before further foundation work.

1. **TICKET-198**: public home and invitation guidance; /dev index and invitation preview.
2. **TICKET-199**: RSVP frontend journey and both confirmation outcomes.
3. **TICKET-200**: table entry, menu and ordering-state previews.
4. Next select the existing gate and kitchen screen tickets, followed by admin pages, after checking their live dependencies. Split presentation slices only when needed; never claim production integrations complete from a mock.

199 and 200 are urgent and depend on 198. Build 199 first. Their branches start from develop after the preceding navigation work is reviewed and merged. Full invitation behavior remains in TICKET-037 and its dependent tickets. TICKET-015 remains paused by the user; preview work does not certify its typography evidence.

## What can be visited

- `/`: Uchenna and Adaora, Saturday 19 December 2026. Venue and time pending.
- `/invite`: how guests will receive their personal link; no token lookup or RSVP yet.
- `/dev`: reviewer navigation and clearly labelled pending work.
- `/dev/invitation`: layout preview, theme links, sample photo/venue/dress code. No submission.
- `/dev/theme`: existing shared component showcase.

Development home links to /dev. In a production build, reviewers open /dev directly; it contains no guest records or private links. Existing /order, /checkin, /kitchen and /admin are still placeholders.

## Photo provenance

Invitation preview uses the spike's sample image, originally https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=85&fm=webp. It is labelled as a sample and is not represented as the couple. Replace it with an approved photograph before real invitation delivery. User confirmed names and date; all other sample details remain provisional.
