# Font and layout remediation

The production build and 20 focused browser cases pass on 13 November 2026. Mobile and desktop each compare 60 exact canvas pixel/advance results across five font faces, three weights and Latin, mixed Igbo/Latin-1 and complete-fallback text. Actual requests prove the common Inter face handles `Ọgbọnọ · Crème brûlée` without requesting complete Inter, while Cyrillic still requests the complete original. All four theme cards render without JavaScript or external fonts.

Twelve cold-font cases hold font responses for 2.5 seconds on home, 404 and staff entry at 375px/1280px in both default schemes. Every case has exactly zero CLS, no horizontal overflow and no axe violations. Screenshots are preserved in `screenshots/`. The home eyebrow and staff description now have stable left origins within centered columns; other headings, date and actions retain their layout.

Four real positive invitation/ordering journeys pass with the context-wide error/CLS guard. Three deliberately failing diagnostic cases independently confirm that console errors, page errors and positive layout shifts are retained across navigation and rejected at the guard assertion. These expected failures are proof of enforcement, not passing application cases.

Six unit tests verify original font metadata, Latin and supported Igbo coverage, canonical decomposition components, source/output hashes, approved feature lists and variable axes. The generator retains complete originals and original Latin assets used by native offline/ordering pages. Common Inter is 53,532 bytes; the previous light invitation requested the 50,501-byte Latin face plus 237,055-byte complete face. These are font file sizes, not a new Lighthouse score or total wire measurement.

A rejected intermediate approach split Igbo into separate faces; actual canvas comparison caught Cormorant italic shaping changes. A second comparison caught Jost's dependence on canonical decomposition marks. Both were fixed in the generator; neither assertion was weakened. Existing character coverage and fallback behavior are preserved.

Latest prior CI Lighthouse reports used the light theme and scored 75/78/90 (median 78); earlier local runs used the OS dark theme and scored median 90. They are distinct theme/runtime measurements. Fresh controlled measurement remains required. Physical-device/screen-reader checks and full launch conformance remain release gates. No completion or 95-score claim is made here.

Logs: `/tmp/TICKET-116-common-nfd-build.log`, `/tmp/TICKET-116-common-nfd-browser.log`, `/tmp/TICKET-116-positive-guest.log`, `/tmp/TICKET-116-negative-guard.log`. Raw prior Lighthouse reports remain preserved separately.
