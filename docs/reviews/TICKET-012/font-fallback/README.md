# Font fallback follow-up — 31 October 2026

CI identified Welcome back moving up3px during Cormorant loading. Registry fallbacks now preserve Next's metric adjustments and include Liberation font aliases for Linux. Primary faces, weights and swap remain unchanged.

Mac: four normal/delayed mobile/desktop cases pass, with all four fallback faces actually loaded. Linux: after correcting the localhost/CSP test origin, delayed Inter caused CLS0.005160346984863281 with serif-only fallback; the full serif/sans repair gives zero in heading-first and body-first cases. Earlier unstyled host.docker.internal runs are invalid evidence.

Twenty-four screenshot cases pass (admin/sign-in and dev/theme, four themes ×375/768/1280). Four admin sheets show all12 sign-in states and were inspected: readable typography, no clipping, bottom action visible, tokens preserved. Original settled-font captures are retained. Full-length showcase slice inspection and final full gate/CI remain pending; this is not final UI approval.

Physical-device checks remain unverified under release gate201. No guest release is approved.
