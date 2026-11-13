"""Subset common order-page glyphs with fonttools[woff]==4.60.1; full faces remain fallback."""
import hashlib
import json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/modules/ordering/fonts"
OUTPUT.mkdir(exist_ok=True)
# Common English UI/menu plus typographic punctuation; arbitrary Unicode names
# retain the exact full original font through complementary CSS unicode ranges.
POINTS = sorted(set(list(range(0x20, 0x7f)) + list(range(0xa0, 0x100)) + [0x143, 0x144, 0x1e44, 0x1e45, 0x1eca, 0x1ecb, 0x1ecc, 0x1ecd, 0x1ee4, 0x1ee5, 0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026]))
def ranges(points):
    output = []
    start = previous = points[0]
    for point in points[1:]:
        if point != previous + 1:
            output.append(f"U+{start:X}-{previous:X}" if previous != start else f"U+{start:X}")
            start = point
        previous = point
    output.append(f"U+{start:X}-{previous:X}" if previous != start else f"U+{start:X}")
    return ",".join(output)
covered = set(POINTS)
manifest = {"generator": "fonttools[woff]==4.60.1", "codepoints": POINTS, "primaryRange": ranges(POINTS), "fallbackRange": ranges([cp for cp in range(0x110000) if cp not in covered]), "fonts": []}
IGBO = [0x143, 0x144, 0x1e44, 0x1e45, 0x1eca, 0x1ecb, 0x1ecc, 0x1ecd, 0x1ee4, 0x1ee5]
BASE = [cp for cp in POINTS if cp not in IGBO]
manifest["primaryRange"] = ranges(BASE)
manifest["igboRange"] = ranges(IGBO)
for family in ["cormorant", "inter", "playfair", "jost"]:
    for variant, characters in [("base", BASE), ("igbo", IGBO)]:
        # Base comes from the already-approved Latin face, retaining its exact
        # OpenType feature closure. The small extra subset adds Igbo diacritics.
        source = ROOT / f"src/modules/theming/fonts/{family}{'-latin' if variant == 'base' else ''}.woff2"
        font = TTFont(source, recalcTimestamp=False)
        options = subset.Options()
        options.layout_features = ["*"]
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
        options.name_legacy = True
        options.name_languages = ["*"]
        operation = subset.Subsetter(options=options)
        operation.populate(unicodes=characters)
        operation.subset(font)
        target = OUTPUT / f"{family}{'-igbo' if variant == 'igbo' else ''}.woff2"
        font.save(target)
        data = target.read_bytes()
        manifest["fonts"].append({"family": family, "variant": variant, "codepoints": characters, "file": str(target.relative_to(ROOT)), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "sourceFile": str(source.relative_to(ROOT))})
(OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print({"totalBytes": sum(face["bytes"] for face in manifest["fonts"]), "faces": [(face["family"], face["variant"], face["bytes"]) for face in manifest["fonts"]]})
