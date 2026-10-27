# Ticket

Ticket: TICKET-050

# Summary

Build an invitation Share menu for WhatsApp, email, copying and the native share sheet. This draft currently contains the URL builder and tests only; the menu UI is still to be implemented.

# Changes

Pure validated URL builder reuses phone normalization, encodes recipient/subject/body separately, preserves emoji and line breaks, and returns usable errors for malformed input. No message is sent and no invitation status is changed.

# Acceptance criteria and evidence

- URL builders: 17 unit cases pass, including emoji, line breaks, unsafe contacts, credentials in URLs and malformed Unicode.
- Native sharing and clipboard confirmation: not implemented.
- Keyboard and mobile menu: not implemented.

# Verification

The initial suite failed on the missing module. A relative-URL exception found by the tests was fixed; all 17 cases pass. Quick gate passed lint, types and 17 related tests. Full verification, browser checks and screenshots have not run.

# Risks and rollout

Draft, not ready to merge. No dependencies or migrations. Sharing UI, fallback behavior and device verification remain outstanding. Caller-supplied wording is separate TICKET-052; sent tracking is TICKET-051. Revert the helper if needed; no data rollback.

# Screenshots

Pending UI implementation.

# UI checklist

Not verified yet. The next step builds and checks the actual menu in both themes at 375/768/1280, including keyboard and reduced motion.

# Harness changes, if any

None.
