"""Generate common Latin/Igbo primary faces with fonttools[woff]==4.60.1.

Existing Latin source faces and complete originals remain unchanged.
Combining Latin and Igbo in one face preserves mixed-word OpenType shaping.
Other code points, including combining tone marks, retain the complete fallback.
"""
import hashlib
import json
import unicodedata
from pathlib import Path
import fontTools
from fontTools import subset
from fontTools.ttLib import TTFont

if fontTools.__version__ != "4.60.1":
    raise RuntimeError("Use the pinned fonttools[woff]==4.60.1 generator")
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src/modules/theming/fonts"
POINTS = [0x143, 0x144, 0x1e44, 0x1e45, 0x1eca, 0x1ecb, 0x1ecc, 0x1ecd, 0x1ee4, 0x1ee5]
provenance = {face["name"]: face for face in json.loads((OUTPUT / "provenance.json").read_text())["fonts"]}
manifest = {"generator": "fonttools[woff]==4.60.1", "codepoints": POINTS, "fonts": []}
for family in ["cormorant", "cormorant-italic", "inter", "jost", "playfair"]:
    source = OUTPUT / f"{family}.woff2"
    font = TTFont(source, recalcTimestamp=False)
    latin = TTFont(OUTPUT / f"{family}-latin.woff2", recalcTimestamp=False)
    decomposed = {ord(character) for point in POINTS for character in unicodedata.normalize("NFD", chr(point))}
    characters = sorted(set(latin.getBestCmap()) | ((set(POINTS) | decomposed) & set(font.getBestCmap())))
    supported = [point for point in POINTS if point in font.getBestCmap()]
    # Preserve original coverage; missing glyphs continue to the existing metric fallback.
    options = subset.Options()
    options.layout_features = provenance[family]["primary_layout_features"].split(",")
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_legacy = True
    options.name_languages = ["*"]
    operation = subset.Subsetter(options=options)
    operation.populate(unicodes=characters)
    operation.subset(font)
    target = OUTPUT / f"{family}-common.woff2"
    font.save(target)
    data = target.read_bytes()
    manifest["fonts"].append({"family": family, "layoutFeatures": options.layout_features, "codepoints": supported, "decompositionCodepoints": sorted(decomposed & set(font.getBestCmap())), "file": target.name, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(), "latinSourceSha256": hashlib.sha256((OUTPUT / f"{family}-latin.woff2").read_bytes()).hexdigest()})
(OUTPUT / "common-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
print([(face["family"], face["bytes"]) for face in manifest["fonts"]])
