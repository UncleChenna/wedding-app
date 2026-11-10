# Dense signed-pass decoder regression

`dense-signed-pass.png` is the exact 512×512 synthetic QR frame retained from
TICKET-065's local actual-worker reproduction on 2026-11-10. It contains an
ephemeral loopback read-only pass, not a real guest, credential or signing key.
The decoded text SHA-256 is
`9f1fb2db123433911c2e216afaa8e281670b35ade0039185e32e3344adc6b082`.

ZXing's normal detector and TRY_HARDER both returned NotFound at full size.
PURE_BARCODE confirmed the encoded text was intact; normal detection succeeded
at half size. The four real-video regression cases failed in Chromium/WebKit,
then passed with the bounded production scale retry. PURE_BARCODE is never used
in production. The tests retain exact text identity, normal delivery throttling
and camera-track shutdown checks.
