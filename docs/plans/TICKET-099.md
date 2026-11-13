# TICKET-099 — invitation design editor

2026-11-13. Add an authenticated admin photo/wording editor using the existing upload service. Persist one versioned design; expose only its selected photo through a public image route so guest image optimization works. Explicit save is publication; replacing the selection cannot erase previously cached public copies.

Connect the saved design to the guest letter after TICKET-038 integrates. Verify file validation, failed-upload text preservation, server authorization, concurrent save rejection, isolated migration/seed/RLS behavior, and the real admin-to-guest browser journey. Retain final photo rights and physical-device checks in their release tickets.
