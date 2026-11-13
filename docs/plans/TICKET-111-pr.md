# Ticket

Ticket: TICKET-111

# Summary

Staff can choose when to reload for a new version without discarding queued check-ins. A waiting worker shows an unobtrusive notification with Reload and Later; retained attempts block Reload. The page checks the durable journal again under the scanner publication lock immediately before navigation.

# Changes

- Detect already-waiting and newly installed workers, including another tab's activation, without automatically reloading that tab.
- Use the existing TICKET-180 worker protocol and validate bounded replies. Unknown or unavailable state fails closed.
- Keep all attempts, including rejected entries, protected. Recheck after activation to cover new entries arriving during the update.
- Render shared themed controls in document flow so they cannot cover scanning/forms. Include the offline scanner shell and /dev/theme examples.
- Keep first installation silent, ignore stale replies and clean up listeners/timers.

# Acceptance criteria and evidence

- Fifteen focused tests pass for durable locking, pending/rejected attempts, unavailable storage, invalid replies, explicit activation, dismissal and other tabs.
- Six actual Chromium/WebKit N/N+1 worker tests pass, including pending evidence, declined update, interrupted reload, additive migration and rollback, then explicit acceptance after exact acknowledgements.
- All-theme browser review passes at375/768/1280: twelve screenshots, axe, tap targets, overflow, keyboard and reduced motion.
- Production build and six actual worker cases pass after integrating develop3be8bd693d4a880f11bf72e177519161948e954e (includes184/067). Independent review found no blocker. Hosted CI remains pending.

# Verification

Initial quick run passed types and15related tests; three type-import lint errors in the browser fixture were corrected, then focused ESLint passed. Full hosted verification remains pending; no physical-device or fresh Lighthouse result is claimed.

# Risks and rollout

No dependency, migration, credentials or forced update. Missing Web Locks, corrupt/evicted evidence or unresponsive workers leave the page open. Older saved scanner bundles gain the UI when next prepared online. Native guest ordering does not use the React registration component; this ticket's required staff update path includes gate, kitchen/bar and admin.

# Screenshots

`docs/reviews/TICKET-111/desktop/`: ready and deferred notification, four themes ×375/768/1280. All twelve inspected.

# UI checklist

PASS: tokens, restrained shared Card/Button,18px staff copy,44px controls, no overlay, no movement, keyboard and all-theme axe/contrast. No new image/QR/social metadata. Hidden state renders nothing. Guest page Lighthouse and physical-device QA remain unverified release checks under the owner's standing preview disposition; no release gate removed.

# Harness changes, if any

The existing queue-upgrade browser suite additionally exercises the production client watcher against real successive workers; all original cases remain.
