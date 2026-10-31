# TICKET-047 review — 2026-10-31

Base develop: fd91e877e29b32ef911acfd45036ad65767732c7. The image endpoint is /invitation-preview;
the optional theme parameter accepts only registered theme IDs. Without it, the stored light theme is used.

| Check                    | Result and evidence                                                                                                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots              | PASS: four 1200x630 PNGs and twelve actual endpoint screenshots at375/768/1280 in this directory, all inspected. Browser-native black surrounds are not part of the PNG.                                                                        |
| Tokens                   | PASS: foreground/background/primary and display/body fonts come from the validated theme. No new palette literals.                                                                                                                              |
| Restraint and typography | PASS: one photograph, names, date and approved headline; no decorative panels or extra actions.                                                                                                                                                 |
| Mobile                   | PASS for fixed image: each viewport shows the complete composition. No application controls changed.                                                                                                                                            |
| Motion                   | N/A: static PNG and metadata only; no animation added.                                                                                                                                                                                          |
| Keyboard                 | N/A: no new interactive surface or focus behavior.                                                                                                                                                                                              |
| Contrast                 | PASS: text uses validated foreground/background and primary/background pairs in all four themes, never over the photo.                                                                                                                          |
| Load and images          | Fixed1200x630 metadata and alt text pass. PNG renderer embeds local JPEG/font bytes; browser next/image is not used inside next/og. Browser typography remains next/font. Homepage Lighthouse CLS0.00007339025002649255 is NOT a zero-CLS pass. |
| Performance              | PASS for public homepage scores99/100/100, Accessibility100 in three serial Lighthouse13.6.0 runs. See performance.json. No personal-route Lighthouse result claimed. No new browser JS or in-page image downloads.                             |
| Copy                     | PASS: approved couple names/date and shared invitationSiteCopy.headline. Photo is an explicitly approved Unsplash placeholder.                                                                                                                  |
| Shared components        | N/A: server PNG rendering cannot reuse browser controls; existing theme registry and approved copy reused.                                                                                                                                      |
| Sharing/devices          | Crawler-like browser check passes for two isolated synthetic invitations, with identical metadata and no private names, IDs or tokens. Physical WhatsApp iOS/Android remains NOT VERIFIED.                                                      |
| QR/staff                 | N/A: unchanged.                                                                                                                                                                                                                                 |
| Verification             | Unit contracts2 pass, production build passes, targeted Playwright3 pass. Full verify pending.                                                                                                                                                  |

Findings resolved: page-level Open Graph overrides dropped inherited image metadata; the old file-convention placeholder took priority over explicit metadata. The new public route replaces that placeholder.
Metadata comparison retains every tag and compares canonical ordering because viewport tags can stream in a different order.

Review: CHANGES REQUESTED until full verification, zero-CLS disposition and physical-device requirement are resolved. No release approval.
