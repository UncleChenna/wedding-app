# PDF font instances

Static weight-400 TTF instances from the same hash-pinned Google Fonts sources as the site's web faces. Inter retains optical size 14. Full glyph sets and original OFL licenses are retained. These server assets are not browser downloads.

Regenerate with `scripts/generate-pdf-fonts.py` in an isolated Python environment with fonttools 4.60.1. No downloads occur during a build or PDF request. Provenance records source and output SHA-256 hashes. The Next file-tracing include packages the assets with the PDF endpoint.

React-pdf requires static TTF/WOFF rather than the website's variable WOFF2 files: https://react-pdf.org/docs/v4/fonts.
