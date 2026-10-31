# Bundled typefaces

Sources and SHA-256 hashes are pinned in provenance.json. Original SIL OFL licenses are included beside each family. Assets contain the full upstream glyph sets, not a Latin-only subset.

Generated from official google/fonts revision 6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec using wawoff2 2.0.1. Inter first uses fonttools 4.60.1 varLib.instancer with opsz=14 to preserve the former Google-loader optical default; its full weight axis and glyphs remain. No font download or conversion runs during application builds.

To update: download the exact source URLs into an isolated scratch directory; verify source hashes; pin Inter optical size with fonttools varLib.instancer inter.ttf opsz=14 --output inter-opsz14.ttf; compress each source with pnpm --package=wawoff2@2.0.1 dlx woff2_compress.js input.ttf output.woff2. Review licenses and refresh provenance hashes. Preserve registry weight/style, fallback and preload settings. Recheck actual font metadata, all-theme typography, delayed-font CLS, Lighthouse, three cold builds and final CI before review.
