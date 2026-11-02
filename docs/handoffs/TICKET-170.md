# TICKET-170 handoff

## 2026-10-27 — TICKET-170 — QR paper and decorative accent tokens

- **Who / agent / branch:** unclechenna · claude · `TICKET-170`, base `develop` cc5092d.
- **Changed:** tokens `decorative`, `decorative-foreground`, `qr-ink`, `qr-paper`; `checkQrPolarity` in `loadTheme`; shared `<QrCode>` in `src/modules/shared/components/ui/qr-code.tsx` (import from that file, not the barrel); `/dev/theme` shows both. Dependencies `qrcode`, dev `@types/qrcode` and `jsqr`, approved by the owner.
- **Checks:** theming + QR unit tests, `e2e/qr-code.spec.ts` (decodes the painted pixels per theme), `pnpm verify` via `t:pr`.
- **Not verified:** real iOS/Android camera scans (TICKET-201/TICKET-138); Lighthouse.
- **Learned:** the site CSP blocks `fetch("data:…")` in tests; decode base64 with `atob` instead. The owner, not an agent, must create `.harness/approved-writes.json`; an agent attempt is refused.
- **Next:** TICKET-013 (two more presets must define the four new tokens), then TICKET-021. TICKET-044/094 can use `<QrCode>` once their data tickets land.
