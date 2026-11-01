# Ticket

TICKET-110 — Add an iOS Add to Home Screen guide

# Summary

iPhone and iPad visitors can open a short installation guide from staff pages or the invitation's actual pass section. It explains Safari sharing and offers Safari-opening guidance for in-app browsers. The guide is absent in standalone mode and never opens automatically.

# Changes

- Pure, tested browser-hint detection covers Safari, iPad desktop user agents, alternate iOS browsers, webviews and both standalone signals.
- Reuses the shared Sheet and Button, with token-colored functional illustrations and 18px body/control text.
- Retains a conditional WhatsApp note even for Safari-looking user agents; UA hints cannot reliably identify every webview.
- Mounted in the staff layout, conditional pass section and theme showcase.
- Does not copy invitation links or force browser navigation.

# Acceptance criteria and evidence

- Detection criterion:13 unit cases pass.
- Automated browser cases:28 passed with Safari/WhatsApp UA fixtures, all themes and375/768/1280 widths, keyboard trapping, Escape, focus return, axe and tap-target checks.
- Actual iPhone WhatsApp/manual installation is NOT VERIFIED. The manual criterion stays unchecked.
- Full local verification failed six invitation focus checks; CI failed the Emerald Night envelope CLS check. This remains an unfinished draft.

# Verification

Initial missing-module regression failed before implementation. Quick verification initially found an unconditional matchMedia assumption; guarded the optional API and reran successfully (17 related tests).
Production build passes. Two browser review runs were interrupted by macOS maintenance sleep: one trace has a913665ms evaluation and pmset records a matching915-second sleep. No timeout or assertion changed. A process-scoped caffeinate run then passed28 cases in8 seconds. Final local gate:527 unit passed,26 skipped;597 browser passed,135 skipped,6 failed. All28 guide cases passed. Unchanged isolated invitation focus rerun:26 passed. CI41270521817:602 passed,135 skipped,1 envelope CLS failure. Logs are in artifacts/TICKET-110.

# Risks and rollout

UA detection is only a hint, not a guarantee about WhatsApp. Physical iPhone testing remains mandatory. The instructions do not imply offline readiness; icons, offline pass and scanner remain separate tickets. Preserve the personal invitation link because the application manifest launches the public site.

Integration lines overlap TICKET-109. Both branches started from develop c9edef6cb137a194f9c215fc5b61b08488a54aa0; integrate sequentially and retain both controls after review. No migration or new dependency. Reverting this ticket removes the guide.

# Screenshots and UI checklist

Screenshots are under docs/reviews/TICKET-110/THEME/WIDTH/guide.png. All12 final guide screenshots inspected at375/768/1280. See docs/reviews/TICKET-110/README.md for every checklist result. Full gates failed; guest performance and physical-device checks remain unverified. Automated contrast, keyboard, reduced-motion, overflow and tap-target assertions pass. Actual WhatsApp sharing and native install checks remain unverified. No QR output or photograph changed. Staff scan/status behavior is unchanged.

# Review steps

Use an iPhone/iPad Safari user agent on /checkin, activate Add to Home Screen and follow the sheet. Test Escape, reopening, Tab/Shift+Tab and Got it. In standalone mode the trigger must be absent. The theme showcase demonstrates the same control under an iOS user agent.

# Harness changes

None. Temporary sleep prevention was limited to verification processes, without changing permanent power settings.
