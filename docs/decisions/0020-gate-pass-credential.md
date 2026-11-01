# 0020 — Gate pass credential and offline trust

- Status: Proposed · 2026-11-01 · TICKET-169 (awaiting owner approval of every row in the decision table)

**Context.** The PRD requires every scanner to verify a guest's QR without the server (CHK-6). The QR must carry an
Ed25519-signed token and scanners must hold only the public key ([Security](../prd.md#security)). Guests reopen
the same link on the day (INV-2), and a forwarded screenshot works only once per seat (INV-7, CHK-3). Venue signal
is unknown ([Connectivity plan](../prd.md#connectivity-plan-signal-unknown)). Two contradictions must be settled
before TICKET-056 signs anything:

1. The PRD journey says the QR is the invitation link, but the invitation link (`/i/<token>`) lets anyone holding
   it edit the RSVP. A pass that is shown at the gate, photographed and forwarded must not also be an RSVP key.
2. A disconnected scanner can't learn about revocations, reissues or other scanners' admissions until it
   reconnects, so "offline" and "always current" can't both be true. Staff need honest rules for the gap.

The schema already carries what the contract needs: `invitations.token_version` (bumped on reissue, TICKET-043),
`invitations.status`, `rsvps.count_attending`, and `check_ins.client_event_id` for idempotent offline sync.

**Decision (proposed).**

1. **Two URLs, two powers.** The personal link `/i/<token>` stays the only way to view and edit an RSVP. The QR
   encodes a separate, read-only pass URL, `https://<domain>/p/<signed-pass>`. Opening it shows the pass (names,
   party size, table) and never shows the RSVP form. Scanners read the signed part straight from the QR and don't
   load the page. The PRD journey text is amended to say "the page shows their pass QR" instead of implying the
   QR is the invitation link. _Rejected:_ encoding `/i/<token>` in the QR, because one forwarded screenshot would
   hand out RSVP editing and the invitation secret.
2. **Minimal signed payload.** `v` (format 1), `kid` (signing key id), `inv` (invitation id), `ver`
   (`token_version`) and `iat` (issued at, seconds). The payload holds no names, phone numbers or party size, which
   keeps the QR small and the payload free of personal data. Names, party allowance, table and status come from the
   scanner's cached guest snapshot. Encoding is base64url `payload.signature`. Key handling and rotation are
   TICKET-056 and TICKET-125.
3. **Allowance comes from the snapshot, not the pass.** A party-size edit changes `count_attending` only, so
   existing passes stay valid with no reissue and the new allowance applies once each scanner's snapshot
   refreshes. A reissue (TICKET-043) bumps `token_version`: a pass whose `ver` is lower than the snapshot's shows
   **red, "Replaced pass"** and staff ask for the new one.
4. **Snapshot freshness.**
   - Online scanners refresh the guest snapshot every **5 minutes**, plus immediately after the server confirms
     any revocation, reissue or admission.
   - After **30 minutes** without a refresh, the device shows a persistent amber banner: "Guest list last updated
     N min ago — new changes may not show". Scanning continues.
   - There is no hard maximum age while the staff session is valid, because the gate must not stop if the signal
     drops all evening.
5. **A valid signature not in the snapshot.** This happens when an invitation was created after the device's last
   refresh. The device shows **amber, "Not on this device's list yet"**. Staff may admit after a name check, and
   the admission is flagged for review on sync.
6. **Revocation honesty.** A disconnected device treats a pass as valid unless its own snapshot says otherwise.
   When the snapshot is stale (rule 4), a green result adds the line "List not refreshed for N min". Staff are
   trained that a revoked-after-refresh pass can still read green on a stale device.
7. **Device and session expiry.** Staff sessions and the cached snapshot expire at **06:00 on the day after the
   event**, in the event time zone. Assumption 10 already sets this for PINs. On expiry the device wipes the
   snapshot and the queued events that have synced. Unsynced events are kept until they upload (TICKET-180).
8. **Lost or stolen device.** The device holds only the public key, so it can't mint passes. Its snapshot does hold
   names, party sizes and tables, but never phone numbers, emails or dietary notes. An admin revokes the device
   (TICKET-064/096), and the server rejects its sessions and refuses its future syncs. Queued events already
   uploaded remain valid. No key rotation is needed. The snapshot's personal data exposure is recorded as an
   accepted risk.
9. **Clock skew.**
   - Reject passes whose `iat` is more than **10 minutes in the future** by the device clock.
   - Record device time as `checked_in_at` and server receive time separately (TICKET-062).
   - Order reconciliation by server receive time when device clocks disagree by more than 10 minutes.
10. **Excess admissions from disconnected scanners.** Two offline scanners can each admit the same seats. On sync
    the server **accepts every physical admission**, because people already through the gate can't be un-admitted.
    It marks any admission beyond the allowance as a **double entry** for the admin scan log (TICKET-067, TICKET-173,
    TICKET-174). The scanner that syncs second shows the conflict on its next result for that invitation. Staff
    escalate double entries to the couple's contact; they don't challenge guests already inside.

**Consequences.**

- TICKET-056 can sign passes, TICKET-057 can verify them, and TICKET-183 can build the read-only `/p/` page.
- TICKET-044 shows the `/p/` QR inside `/i/<token>` after a yes RSVP.
- Snapshot size grows with guest count, about 300 short rows, which is well within device storage.
- The stale-revocation window is a deliberate trade for working with no signal, and staff training (TICKET-162)
  must cover it.
- Reversal: the payload carries `v`, so a later format can coexist with format 1 during a transition.

**Validation.** Owner approval of each row in the decision table in the
[TICKET-169 ticket](../../tickets/TICKET-169-approve-offline-freshness-and-the-gate-credentia.md) is pending. No
code implements this yet. TICKET-056, TICKET-057, TICKET-065 to TICKET-068 and TICKET-136 carry the tests.
