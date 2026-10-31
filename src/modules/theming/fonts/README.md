# Bundled typefaces

Sources and SHA-256 hashes are pinned in provenance.json. Original SIL OFL licenses are included beside each family. Complete assets retain the full upstream glyph sets. Small primary subsets cover U+0000-00FF, U+2000-206F and U+20A0-20CF. Complementary unicode-range declarations keep complete files off the initial Latin download path while preserving other characters.

Generated from official google/fonts revision 6c1dbe27dcf7d817d4b62cec033ba77fa8e2a5ec using wawoff2 2.0.1. Inter first uses fonttools 4.60.1 varLib.instancer with opsz=14 to preserve the former Google-loader optical default; its full weight axis and glyphs remain. No font download or conversion runs during application builds.

To update: download the exact source URLs into an isolated scratch directory; verify source hashes; pin Inter optical size with fonttools varLib.instancer inter.ttf opsz=14 --output inter-opsz14.ttf; compress each source with pnpm --package=wawoff2@2.0.1 dlx woff2_compress.js input.ttf output.woff2. Review licenses and refresh provenance hashes. Preserve registry weight/style, fallback and preload settings. Recheck actual font metadata, all-theme typography, delayed-font CLS, Lighthouse, three cold builds and final CI before review.

Primary subsets are generated with fonttools4.60.1 pyftsubset from the same prepared TTF sources, using --unicodes=U+0000-00FF,U+2000-206F,U+20A0-20CF, --layout-features=<family-specific list from provenance.json>, --name-IDs=_, --name-legacy, --name-languages=_, --notdef-glyph, --notdef-outline, --recommended-glyphs and --glyph-names, then the same pinned WOFF2 compressor. The complete files are not removed. Browser tests prove on-demand non-Latin loading and identical rasterized sample glyphs at weights400/500/600; unit tests compare the requested character coverage.

The primary OpenType feature lists were inspected from the retained Google-font production build at base fd91e877e29b32ef911acfd45036ad65767732c7. They preserve its feature availability rather than introducing unused alternate glyph sets into first paint. Complete-font assets retain additional features and glyphs.
