# TICKET-266 verification

All application select consumers now use the shared themed combobox and listbox. A hidden
native form bridge preserves named values and validation; the native control is visible
only before JavaScript hydration or with JavaScript disabled. No new dependencies.

- Quick verification: lint, types and 176 related tests passed.
- Final full unit suite: 289 files passed; 2,203 tests passed and 241 skipped.
- Full verification passed formatting, lint, types and tests; its build initially lacked
  environment variables. Retrying with local-only environment values compiled and passed
  TypeScript, but Next.js stopped with its security-upgrade advisory (SecurityFatalError).
  Production build completion is therefore unverified; no framework upgrade is included.
- Browser: custom country menu inside the invitation modal at 375×812, 768×1024,
  1280×800 and 375×400 stays within the viewport. Screenshots are in `screenshots/`.
- Escape closes the menu without closing the modal. Country selection preserves the
  international submitted phone value. Keyboard typeahead selects the showcase meal.
- Axe found no violations in the open modal/menu.
- Independent source review identified fallback accessibility attributes and sizing;
  both were restored and covered by a server-rendered fallback regression test.
- Physical devices and screen readers remain unverified. The full browser suite was
  adapted to custom-menu interaction but not run in its entirety.

The browser exercise used the local TICKET-265 invitation UI with this shared component,
so the country selector also demonstrates compact closed labels and full country names
in the open menu. TICKET-265 remains a separate PR.
