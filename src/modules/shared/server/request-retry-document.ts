import "server-only";

import { activeThemesToCssText, getActiveThemes } from "@/modules/theming";

/** Standalone outage document: no database/render fetch and no private URL interpolation. */
export function requestRetryDocument(context: "invitation" | "ordering" = "invitation") {
  const fonts = ["cormorant", "playfair", "inter", "jost"];
  const fontFaces = fonts
    .map(
      (font) =>
        `@font-face{font-family:"${font}";src:url("/share/fonts/${font}.ttf") format("truetype");font-display:swap;font-weight:100 900}`,
    )
    .join("\n");
  // Keep metrics aligned with src/modules/theming/font-fallbacks.css.
  const metrics = [
    ["cormorant", "Times New Roman", "Liberation Serif", 95.27, 29.59, 96.98],
    ["playfair", "Times New Roman", "Liberation Serif", 97.25, 22.56, 111.26],
    ["inter", "Arial", "Liberation Sans", 90.44, 22.52, 107.12],
    ["jost", "Arial", "Liberation Sans", 111.45, 39.06, 96.01],
  ] as const;
  const fallbackFaces = metrics
    .map(
      ([font, mac, linux, ascent, descent, size]) =>
        `@font-face{font-family:"${font}-fallback";src:local("${mac}"),local("${linux}");ascent-override:${ascent}%;descent-override:${descent}%;line-gap-override:0%;size-adjust:${size}%}`,
    )
    .join("\n");
  const fontVars = fonts.map((font) => `--font-${font}:"${font}","${font}-fallback";`).join("");
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<title>Please try again shortly</title><style>
${fontFaces}
${fallbackFaces}
:root{${fontVars}}
${activeThemesToCssText(getActiveThemes())}
*{box-sizing:border-box}body{margin:0;background:var(--t-color-background);color:var(--t-color-foreground);font-family:var(--t-font-body),sans-serif;font-size:18px;line-height:1.6}
main{min-height:100dvh;max-width:42rem;margin:auto;padding:64px 24px max(32px,env(safe-area-inset-bottom));display:flex;flex-direction:column;text-align:center}
section{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px}
p,h1{margin:0;width:100%}p{max-width:30rem}h1{font-family:var(--t-font-display),serif;font-weight:500;font-size:36px;line-height:1.2;min-height:2.4em;text-wrap:balance}
.description{color:var(--t-color-muted-foreground);min-height:6.4em}form{margin-top:40px}button{font:inherit;font-weight:500;min-height:52px;min-width:44px;width:100%;padding:12px 28px;border:0;border-radius:var(--t-radius-md);background:var(--t-color-primary);color:var(--t-color-primary-foreground);cursor:pointer}
button:focus-visible,a:focus-visible{outline:2px solid var(--t-color-ring);outline-offset:4px}a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;color:var(--t-color-primary);margin-top:24px;text-underline-offset:4px}
@media(min-width:768px){main{justify-content:center}section{flex:none}h1{font-size:48px;min-height:1.2em}.description{min-height:3.2em}button{width:14rem}}
</style></head><body><main><section>
<h1>Please try again shortly</h1><p class="description">Please wait a minute, then try opening ${context === "ordering" ? "the menu" : "your invitation or pass"} again. Thank you for your patience.</p></section>
<form method="get"><button type="submit">Try again</button></form><a href="/">Back to our day</a>
</main></body></html>`;
}
