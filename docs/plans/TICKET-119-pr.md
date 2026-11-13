# Ticket

Ticket: TICKET-119

# Summary

Photographs previously depended on the framework’s WebP-only default and had no repository-wide enforcement for responsive sizes, reserved layout or blur placeholders. Add explicit AVIF/WebP negotiation and an image-usage gate, plus an actual mobile transfer-budget regression.

# Changes

- Configure AVIF first with WebP fallback, using the installed Next.js image documentation. Existing source formats remain the framework fallback for unsupported clients.
- Parse every application TSX file with TypeScript to check next/image imports (including aliases), explicit sizes/alt, dimensions or static metadata/reserved fill, blur metadata and optimization. Prop spreads and raw browser img elements require review rather than bypassing the gate.
- Exempt raw img only in the two named server ImageResponse raster renderers, where embedded pixels are not browser photographs.
- Add a browser test that measures optimized response bytes at375px and requires AVIF/WebP and <=150000bytes. Its evidence contains only dimensions/type/byte counts, never invitation URLs.

# Acceptance criteria and evidence

- Image contract scan: implemented, eight focused tests pass; initial five failures reproduced missing checks and missing format configuration.
- Private invitation <=150KB at375: pending TICKET-038 integration and actual disposable-fixture verification. This PR remains draft until that dependency is merged and the budget test passes.

# Verification

- `pnpm exec vitest run scripts/__tests__/image-policy.test.ts`: eight passed, including actual application source inventory.
- `pnpm verify:quick`: lint, strict types and eight related tests pass.
- Production format negotiation and private invitation budget: not yet run; TICKET-038 is still in progress/review.

# Risks and rollout

AVIF trades first-encode CPU for smaller cached delivery; WebP fallback is retained. No dependency, schema, guest data or storage policy changes. The static gate checks explicit source contracts, not every runtime value; actual image decoding, dimensions and transfer size remain browser checks. Custom loaders or authenticated unoptimized assets need an explicit reviewed delivery contract before adding exceptions. Revert the configuration/helper/tests to roll back.

# Screenshots

No visible UI markup or source image is changed. TICKET-038 owns the hero/crop screenshots; image transport will be verified after integration.

# UI checklist

Rendering/layout/copy/motion are unchanged. Format/transfer evidence is pending; physical-device and release performance checks remain in TICKET-201. This draft claims no final UI completion.

# Harness changes, if any

New image-policy unit gate runs with existing test discovery; no CI, hook or script permissions change.
