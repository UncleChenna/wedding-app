# Installation artwork

Generated files: run `pnpm exec tsx scripts/pwa-icons.ts` from the repository root.
Do not hand-edit PNGs. Re-run after changing the monogram, bundled display fonts or theme tokens.

The public monogram is UA (Uchenna and Adaora). It is build-time wedding identity, not guest data and not a live reflection of admin name edits. Font outlines come from the existing licensed bundled fonts; their provenance and OFL licenses are in src/modules/theming/fonts. The generator uses the font's default outline instance and the theme foreground/background pair. No system font, external image or network request is used. Rasterization uses the Sharp version already pinned through Next; regenerate and review when upgrading Next/Sharp.

Each of four presets has separate 192/512 PNGs for any and maskable purposes, an opaque 180px Apple touch icon, and 12 startup images. The maskable monogram fits inside the central 40%-radius circle. Unknown theme IDs use the Ivory & Gold asset set; adding a preset requires adding it to pwa-assets.ts and regenerating. Runtime custom token edits do not regenerate static artwork.

Startup matrix: CSS screen 375×667 at2x; 390×844,393×852,430×932 at3x; 768×1024 and820×1180 at2x. Both orientations are provided. This is an explicit common-size set, not every Apple device. Media queries select exact dimensions/DPR/orientation. Unsupported devices use platform behavior; physical installation/startup tests remain required in TICKET-114.

Manifest and Apple metadata use the active light preset, preserving the installation branding decision from TICKET-103. Changing presets changes asset URLs. Browser/OS icon refresh timing is platform-controlled.
