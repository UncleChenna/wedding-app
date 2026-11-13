import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import config from "../../next.config";
import { imagePolicyProblems } from "../image-policy";

const imported = 'import Picture from "next/image";';
const staticImage = `${imported} import photo from "./photo.webp";`;

describe("responsive photograph policy", () => {
  it("requires responsive sizes and reserved dimensions even with an aliased import", () => {
    expect(
      imagePolicyProblems(
        `${imported} const x=<Picture src="/photo.jpg" alt="Couple" placeholder="blur" blurDataURL="data:image/webp;base64,AA" />;`,
      ),
    ).toEqual([expect.stringContaining("sizes"), expect.stringContaining("dimensions")]);
  });
  it("checks named-default and namespace aliases and rejects zero dimensions", () => {
    for (const statement of [
      'import { default as Picture } from "next/image";',
      'import * as NS from "next/image";',
    ]) {
      const tag = statement.includes("NS") ? "NS.default" : "Picture";
      expect(
        imagePolicyProblems(
          `${statement} const x=<${tag} src="/photo.jpg" sizes="100vw" width={0} height={200} alt="Couple" placeholder="blur" blurDataURL="data:image/webp;base64,AA" />;`,
        ),
      ).toEqual([expect.stringContaining("dimensions")]);
    }
  });
  it("accepts static import dimensions and generated blur metadata", () => {
    expect(
      imagePolicyProblems(
        `${staticImage} const x=<Picture src={photo} alt="Couple" sizes="100vw" placeholder="blur" />;`,
      ),
    ).toEqual([]);
  });
  it("requires a reserved positioned parent for fill and explicit blur for dynamic sources", () => {
    const source = `${imported} const x=<div><Picture src={url} alt="Couple" sizes="100vw" fill placeholder="blur" /></div>;`;
    expect(imagePolicyProblems(source)).toEqual([
      expect.stringContaining("reserved positioned parent"),
      expect.stringContaining("blurDataURL"),
    ]);
    expect(
      imagePolicyProblems(
        source
          .replace("<div>", '<div className="relative aspect-[4/5]">')
          .replace("fill placeholder", "blurDataURL={blur} fill placeholder"),
      ),
    ).toEqual([]);
  });
  it("does not allow missing alt, disabled optimization or prop spreads to bypass review", () => {
    expect(
      imagePolicyProblems(
        `${staticImage} const x=<Picture {...props} src={photo} sizes="100vw" placeholder="blur" unoptimized />;`,
      ),
    ).toEqual([
      expect.stringContaining("spread"),
      expect.stringContaining("alt"),
      expect.stringContaining("unoptimized"),
    ]);
  });
  it("recognizes conditional images without skipping an actual unreserved wrapper", () => {
    const image = '<Picture src={photo} alt="Couple" sizes="100vw" fill placeholder="blur" />';
    const frame = '<div className="relative aspect-[4/3]">';
    expect(
      imagePolicyProblems(
        `${staticImage} const x=${frame}{ready ? (${image}) : <p>Loading</p>}</div>;`,
      ),
    ).toEqual([]);
    expect(
      imagePolicyProblems(
        `${staticImage} const x=${frame}<div>{ready ? (${image}) : null}</div></div>;`,
      ),
    ).toEqual([expect.stringContaining("reserved positioned parent")]);
    expect(
      imagePolicyProblems(`${staticImage} const x=<div>{ready ? (${image}) : null}</div>;`),
    ).toEqual([expect.stringContaining("reserved positioned parent")]);
  });
  it("rejects empty sizes, missing blur and raw browser images", () => {
    expect(
      imagePolicyProblems(
        `${staticImage} const x=<><Picture src={photo} sizes="" alt="" /><img src="/photo.jpg" /></>;`,
      ),
    ).toEqual([
      expect.stringContaining("sizes"),
      expect.stringContaining("placeholder"),
      expect.stringContaining("raw <img>"),
    ]);
  });
  it("audits every application TSX file, with only explicit ImageResponse renderer exceptions", () => {
    const rasterRenderers = new Set([
      "src/modules/invitations/server/preview-image.tsx",
      "src/modules/invitations/server/pass-image.tsx",
    ]);
    const files = readdirSync("src", { recursive: true, encoding: "utf8" }).filter(
      (name) => name.endsWith(".tsx") && !name.includes("__tests__"),
    );
    const problems = files.flatMap((name) => {
      const file = join("src", name);
      return imagePolicyProblems(readFileSync(file, "utf8"), rasterRenderers.has(file)).map(
        (problem) => `${file}: ${problem}`,
      );
    });
    expect(problems).toEqual([]);
  });
  it("negotiates AVIF with WebP fallback", () => {
    expect(config.images?.formats).toEqual(["image/avif", "image/webp"]);
  });
});
