import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import jsQR from "jsqr";
const root = "artifacts/TICKET-046";
const review = JSON.parse(readFileSync(root + "/review.json", "utf8")) as {
  passUrl: string;
  results: { name: string }[];
};
const results = review.results.map(({ name }) => {
  const files = readdirSync(root).filter(
    (file) => file.startsWith(name + "-") && /^\d+\.rgba$/.test(file.slice(name.length + 1)),
  );
  let found = false;
  for (const file of files) {
    const { width, height } = JSON.parse(
      readFileSync(root + "/" + file.replace(".rgba", ".json"), "utf8"),
    ) as { width: number; height: number };
    const raw = readFileSync(root + "/" + file);
    const code = jsQR(new Uint8ClampedArray(raw), width, height);
    if (code?.data === review.passUrl) found = true;
  }
  if (!found) throw new Error("Signed QR did not decode at 300dpi: " + name);
  return { name, qr: "PASS", dpi: 300, pages: files.length };
});
writeFileSync(root + "/qr-results.json", JSON.stringify(results, null, 2) + "\n");
console.log(results);
