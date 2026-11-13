"""Generate fixed-copy offline fonts with fonttools[woff]==4.60.1; never run at request time."""
import hashlib
import json
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
COPY = json.loads((ROOT / "src/modules/shared/lib/offline-copy.json").read_text())
CHARACTERS = "".join(sorted(set(" ".join(COPY.values()) + COPY["eyebrow"].upper())))
OUTPUT = ROOT / "public/offline-assets"
OUTPUT.mkdir(parents=True, exist_ok=True)
manifest = {"characters": CHARACTERS, "generator": "fonttools[woff]==4.60.1", "fonts": []}
manifest["fallbackCss"] = (ROOT / "src/modules/theming/font-fallbacks.css").read_text()
for family in ["cormorant", "inter", "playfair", "jost"]:
    # The fixed copy uses the same Latin faces (and feature set) as the existing UI.
    source = ROOT / "src/modules/theming/fonts" / f"{family}-latin.woff2"
    font = TTFont(source, recalcTimestamp=False)
    # Published themes may assign any approved family to either role.
    weights = (400, 600)
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_legacy = True
    options.name_languages = ["*"]
    operation = subset.Subsetter(options=options)
    operation.populate(text=CHARACTERS)
    operation.subset(font)
    font = instantiateVariableFont(font, {"wght": weights}, inplace=True)
    assert set(map(ord, CHARACTERS)) <= set(font.getBestCmap())
    assert any(axis.axisTag == "wght" and axis.minValue <= 400 and axis.maxValue >= 600
               for axis in font["fvar"].axes)
    temporary = OUTPUT / f"{family}.woff2"
    font.save(temporary)
    data = temporary.read_bytes()
    digest = hashlib.sha256(data).hexdigest()
    final = OUTPUT / f"{family}-{digest[:16]}.woff2"
    temporary.replace(final)
    manifest["fonts"].append({
        "family": family, "path": f"/offline-assets/{final.name}",
        "sha256": digest, "bytes": len(data),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "sourceFile": str(source.relative_to(ROOT)),
        "weight": "400 600",
    })
target = ROOT / "src/modules/shared/lib/offline-fonts.json"
target.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({"totalBytes": sum(font["bytes"] for font in manifest["fonts"]) }))
