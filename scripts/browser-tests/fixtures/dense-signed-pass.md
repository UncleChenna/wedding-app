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

## Orientation-sensitive finder regression

`orientation-signed-pass.png` is the exact synthetic video frame retained from
Linux WebKit CI run43194895337 on2026-11-12. No real guest or private signing key
is present. Its decoded SHA-256 is
`e1d8d14b42167e15e9669d0ba6cb2080eb38f4f600ea5faacf2a5854b26047f6`.
Normal full-size and half-size detection returned FormatException; rotating the
same frame270degrees allowed normal detection at both sizes. All four original
video regressions failed before the orientation repair. The production decoder
now cycles one half-size retry followed by original-size quarter-turn retries
across successive frames after expected decode failures. Real browser canvas
resampling differed from the diagnostic image library, so full-size rotation is
necessary to retain the failing pixels without resampling distortion. It resets on success or input
dimension changes; unexpected errors still reach camera recovery. No PURE_BARCODE
assumption, increased frame rate or extra camera stream is introduced.
