# TICKET-101 UI review

2026-11-04, branch TICKET-101. Screenshots come from `e2e/admin-settings.spec.ts`, signed in as a real admin (email
code plus TOTP) on this worktree's local Supabase. `<theme>/<width>-settings.png` shows the top of the settings form in
four themes at 375, 768 and 1280px.

| Check                    | Result       | Evidence                                                                                                                |
| ------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS         | 12 captures; 375 Emerald Night inspected in detail. The 5-item phone bar fits, with two labels wrapping onto two lines. |
| Tokens                   | PASS         | Shared `Input`, `Select`, `Textarea`, `Button`; `type-label` legends; no literals.                                      |
| Restraint and typography | PASS         | Four labelled groups, one Save button, 18px admin text, hints in muted text.                                            |
| Mobile                   | PASS         | No horizontal scroll at every width and theme (asserted); fields stack on phones; 44px controls (shared components).    |
| Motion                   | N/A          | No animation.                                                                                                           |
| Keyboard                 | PASS         | Native fields with labels and `fieldset`/`legend`; a refused save focuses the first invalid field (asserted).           |
| Contrast                 | PASS         | Axe: no WCAG A/AA violations, one full scan per theme.                                                                  |
| Load and images          | N/A          | No images.                                                                                                              |
| Performance              | N/A          | Admin screen.                                                                                                           |
| Copy                     | PASS         | Provisional: the group titles, labels, hints and messages in `settingsCopy` and `parseSettingsForm`.                    |
| Shared components        | PASS         | Shared form components only.                                                                                            |
| Sharing and devices      | NOT VERIFIED | Real phones for admin release QA (TICKET-206).                                                                          |
| QR codes                 | N/A          | No QR output.                                                                                                           |
| Staff feedback           | PASS         | Save reports in a status line straight away; errors sit beside their fields.                                            |
| Verification             | See PR       | `pnpm verify` runs in `pnpm t:pr`.                                                                                      |
