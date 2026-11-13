# Ticket

Ticket: TICKET-119

# Summary

Photographs previously depended on the framework’s WebP-only default and had no repository-wide enforcement for responsive sizes, reserved layout or blur placeholders. Add explicit AVIF/WebP negotiation and an image-usage gate, plus an actual mobile transfer-budget regression.

# Changes

- Configure AVIF first with WebP fallback, using the installed Next.js image documentation. Existing source formats remain the framework fallback for unsupported clients.
- Parse every application TSX file with TypeScript to check next/image imports (including aliases), explicit sizes/alt, dimensions or static metadata/reserved fill, blur metadata and optimization. Prop spreads and raw browser img elements require review rather than bypassing the gate.
- Exempt raw img only in the two named server ImageResponse raster renderers, where embedded pixels are not browser photographs.
- Add a browser test that measures optimized response bytes at 375px and requires AVIF/WebP and ≤150,000 bytes. Its evidence contains only dimensions/type/byte counts, never invitation URLs.

# Acceptance criteria and evidence

- Image contract scan: implemented, eight focused tests pass; initial five failures reproduced missing checks and missing format configuration.
- Private invitation ≤150 KB at 375: passed on the actual isolated private invitation after integrating develop `21722cb9`: HTTP 200 AVIF, 28,120 bytes at 375px and DPR 2.625. Evidence: `docs/reviews/TICKET-119/mobile-image-budget.json`.

# Verification

- `pnpm exec vitest run scripts/__tests__/image-policy.test.ts`: eight passed, including actual application source inventory.
- `pnpm verify:quick`: lint, strict types and eight related tests pass.
- Production build passes after integrating the merged hero. Actual private mobile browser test passes (1.4s case / 3.6s suite), including image decoding, HTTP status, AVIF/WebP negotiation and the unchanged 150,000-byte ceiling.
- The fixture requires an explicit opt-in and local database target, creates only synthetic invitation data, tracks settings ownership and cleans only its own rows.
- Fresh hosted CI remains required. Develop currently contains the separate TICKET-113 fixture-order failure, tracked by TICKET-242; this ticket does not bypass that failure.

# Risks and rollout

AVIF trades first-encode CPU for smaller cached delivery; WebP fallback is retained. No dependency, schema, guest data or storage policy changes. The static gate checks explicit source contracts, not every runtime value; actual image decoding, dimensions and transfer size remain browser checks. Custom loaders or authenticated unoptimized assets need an explicit reviewed delivery contract before adding exceptions. Revert the configuration/helper/tests to roll back.

# Screenshots

No visible UI markup or source image is changed. TICKET-038 owns the hero/crop screenshots; the transport evidence above confirms the same hero is served as optimized AVIF.

# UI checklist

Rendering/layout/copy/motion are unchanged. Format and transfer checks pass. Physical-device and release performance checks remain in TICKET-201; this does not certify release readiness.

# Harness changes, if any

New image-policy unit gate runs with existing test discovery; no CI, hook or script permissions change.
