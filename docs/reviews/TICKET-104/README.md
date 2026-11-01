# TICKET-104 review

2026-10-31. Base c9edef6cb137a194f9c215fc5b61b08488a54aa0.

The four assets-_.png sheets show all68 generated PNGs; all inspected. Monograms remain centred with clear margins in both orientations. Four maskable-_.png screenshots show the uploaded512px icons under Maskable.app's minimum-safe-area mask; all inspected, no letter clipping. Pixel tests independently check both192/512 maskable sizes against the40%-radius circle.

Twelve generator/asset tests and three manifest tests cover repeat bytes, committed-file parity, opaque backgrounds, sizes and startup media coverage. Six focused production browser cases pass: manifest parsing, icons and Apple/startup metadata URLs. Quick gate passed before the final four artifact-parity cases were added; full verification result is recorded in the handoff.

## UI checklist

| Item                 | Result and evidence                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screenshots          | PASS for generated artwork: all68 assets inspected in four sheets, four Maskable.app screenshots. Page375/768/1280 screenshots N/A: no page-rendered UI changed. |
| Tokens               | PASS: generator reads registered foreground/background and display-font tokens.                                                                                  |
| Restraint/typography | PASS: single centred UA monogram, bundled display outlines, no decoration.                                                                                       |
| Mobile               | Browser metadata PASS; physical installed icon/startup behavior NOT VERIFIED. No new page controls or layout.                                                    |
| Motion               | N/A: static PNG artwork; no animation added.                                                                                                                     |
| Keyboard             | N/A: no interactive UI added.                                                                                                                                    |
| Contrast             | PASS: existing validated theme foreground/background pairs; no new palette.                                                                                      |
| Load/images          | PNGs are platform icon/startup resources, not page photographs; no next/image/blur requirement. No page layout/content change.                                   |
| Performance          | N/A to new page rendering: static metadata resources, no client code added. Existing release performance gate remains201.                                        |
| Copy                 | N/A: only public initials, no new guest copy.                                                                                                                    |
| Shared components    | PASS: shared metadata builder; no one-off page UI.                                                                                                               |
| Sharing/devices      | NOT VERIFIED: physical iOS/Android installation and WhatsApp behavior; do not infer results from browser metadata.                                               |
| QR                   | N/A: no QR output changed.                                                                                                                                       |
| Staff feedback       | N/A: no staff controls or feedback changed.                                                                                                                      |
| Verification         | Full gate result in handoff; never assume success before terminal log.                                                                                           |

Review disposition: APPROVE for preview delivery under the owner's existing device-QA separation approval. Physical installation remains NOT VERIFIED and explicitly unchecked in TICKET-201, which blocks both guest releases, with full PWA installation retained in TICKET-114. This is not production/device sign-off.

Sources: [maskable safe zone](https://www.w3.org/TR/appmanifest/), [Apple icon/startup metadata](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

## 2026-11-01 integrated verification

Base4463a2ed2d13c751e6b9e31858775a15c7bd097a; integrated head2043800fecf5289f60e97e8c6b9345a993e0462e.
Full pnpm verify PASS:526unit passed/26skipped;617browser passed/135skipped, including the formerly failing envelope scenarios and delayed-font regression. Production build, format, lint and types pass.
Evidence: artifacts/TICKET-104/integrated-verify.log. Icon implementation and artwork are unchanged from the inspected assets.
Earlier failed runs remain recorded in the handoff; the shared TICKET-210 fix is now merged. Hosted final-head verification must pass before merge.
