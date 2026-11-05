# TICKET-064 UI review

2026-11-05, branch TICKET-064. Screenshots come from `e2e/admin-staff.spec.ts`, signed in as a real admin and as a
kitchen device. They are in all four themes at 375, 768 and 1280px:

- `<theme>/<width>-admin-devices.png`: the Devices section on `/admin/staff`, just after a rename.
- `<theme>/<width>-device-name.png`: the kitchen screen showing its new name.

Fixture names are test data.

| Check                    | Result       | Evidence                                                                                                                           |
| ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 24 captures; 375 Ivory & Gold (admin) and Emerald Night (device) inspected in detail.                                              |
| Tokens                   | PASS         | `border-border`, `text-muted-foreground`, `font-display`, `font-medium`; no literals.                                              |
| Restraint and typography | PASS         | One list, one field and button per device; names in the display serif; admin and staff text 18px.                                  |
| Mobile                   | PASS         | No horizontal scroll in every theme and width (asserted on both pages); 44px controls (shared `Input` and `Button`).               |
| Motion                   | N/A          | No animation.                                                                                                                      |
| Keyboard                 | PASS         | Native form; the field is labelled "Device name" and the button is named with the device ("Rename: kitchen device").               |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations at 375 in every theme, on both pages. Revoked state is in words ("Signed out for good").              |
| Load and images          | N/A          | No images.                                                                                                                         |
| Performance              | N/A          | Admin and staff screens, not guest pages.                                                                                          |
| Copy                     | PASS         | Provisional: the Devices intro, "First signed in by …", "Renamed. The device shows it on its next screen." and "This device is …". |
| Shared components        | PASS         | Shared `Input` and `Button`; no new reusable pattern.                                                                              |
| Sharing and devices      | NOT VERIFIED | Real phones and tablets for staff release QA (TICKET-206).                                                                         |
| QR codes                 | N/A          | No QR output.                                                                                                                      |
| Staff feedback           | PASS         | A rename is announced as a status straight away; the device shows the new name on its next screen.                                 |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                                 |
