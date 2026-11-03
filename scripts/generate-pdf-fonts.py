"""Generate static PDF faces from the web fonts' pinned upstream sources.
Run with fonttools==4.60.1 in an isolated environment; no build-time downloads.
"""
import hashlib
import io
import json
from pathlib import Path
from urllib.request import urlopen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
source = root / "src/modules/theming/fonts"
target = root / "src/modules/invitations/fonts"
target.mkdir(parents=True, exist_ok=True)
records = []
for item in json.loads((source / "provenance.json").read_text())["fonts"]:
    if item["name"].endswith("-italic"):
        continue
    data = urlopen(item["source_url"], timeout=30).read()
    assert hashlib.sha256(data).hexdigest() == item["source_sha256"]
    font = TTFont(io.BytesIO(data))
    axes = {axis.axisTag: axis.defaultValue for axis in font["fvar"].axes}
    axes["wght"] = 400
    if "opsz" in axes:
        axes["opsz"] = 14
    static = instantiateVariableFont(font, axes, inplace=False)
    output = target / (item["name"] + ".ttf")
    static.save(output)
    assert "fvar" not in TTFont(output)
    (target / (item["name"] + "-OFL.txt")).write_bytes(
        (source / (item["name"] + "-OFL.txt")).read_bytes()
    )
    records.append({
        "name": item["name"], "source_url": item["source_url"],
        "source_sha256": item["source_sha256"], "axes": axes,
        "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
    })
(target / "provenance.json").write_text(json.dumps({
    "generator": "fonttools 4.60.1 varLib.instancer", "fonts": records
}, indent=2) + "\n")
