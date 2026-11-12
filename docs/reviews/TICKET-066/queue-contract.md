# Offline queue contract

The service worker owns `wedding-scanner-attempts-v1`. Its strict IndexedDB
transaction completes before the page can show a local admission receipt. All
queue operations share the origin-wide scanner publication Web Lock with private
snapshot preparation and invalidation. A failed or corrupt write leaves prior
evidence intact and returns an unavailable/recovery state; it never resets data.

Version2 guest snapshots include server-verified staff/device identity. Legacy
version1 snapshots remain readable but cannot authorize local admission. QR
credentials are verified in the worker using the same public verifier as online
scanning, including canonical signature checks. Manual selection uses a real
snapshot invitation ID. Neither page-supplied eligibility nor page-supplied actor
identity authorizes a write. Raw QR credentials, names and contact details are not
stored in the queue.

Known invitations use canonical admitted counts plus every retained local
positive attempt, including another operator's pending records. Signed unknown
QR passes follow ADR0020's explicit name check; manual unknown selections cannot
use that exception. Observation records have zero people and cannot consume a
place. Every attempt has an immutable UUID, original actor, method, timestamp,
invitation/version, result and count.

A server upload must authenticate as that original staff/device. The server
rechecks credential/session authority after lock waits. Rejected and retry
outcomes remain pending; only committed acknowledgements atomically replace a
pending attempt with a receipt. A durable barrier then prevents spending a stale
snapshot's allowance. Only a subsequently committed canonical snapshot can
retire the exact captured barrier generations; newer acknowledgements survive.
The migration review documents stronger digest binding for new receipts and
historical NULL-digest limitations.

The UI distinguishes a local saved receipt from delivery status. Foreground,
online and manual actions retry without Background Sync. Uncertain writes keep
the exact UUID/count and disable changing selection until recovery. A duplicate
receipt explicitly says not to admit the group again. Other-operator records and
conflicts remain visible; conflict resolution belongs to TICKET-067.

Logout, session expiry, revoked access and private snapshot deletion do not erase
this journal. TICKET-184's complete expiry/recovery integration and TICKET-180's
retention policy remain separate. Operators must not clear browser data to fix
an error. Physical scanner storage, camera and reconnection checks remain release
requirements; automated Chromium/WebKit tests do not certify real phones.
