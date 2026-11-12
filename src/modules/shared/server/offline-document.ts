import "server-only";
import { activeThemesToCssText } from "@/modules/theming/lib/css-vars";
import type { ActiveThemes } from "@/modules/theming/lib/schema";
import copy from "../lib/offline-copy.json";
import manifest from "../lib/offline-fonts.json";

const fallbackNames: Record<string, string> = {
  cormorant: "Cormorant",
  inter: "Inter",
  playfair: "Playfair",
  jost: "Jost",
};
const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

/** Public fixed copy only: never serializes a route, cookie, guest or Next Flight payload. */
export function offlineDocument(themes: ActiveThemes): string {
  const fonts = manifest.fonts
    .map(
      (face) =>
        `@font-face{font-family:"Offline ${face.family}";src:url("${face.path}") format("woff2");font-weight:${face.weight};font-style:normal;font-display:swap}:root{--font-${face.family}:"Offline ${face.family}","${fallbackNames[face.family]} Metric Fallback"}`,
    )
    .join("");
  const css = `${manifest.fallbackCss}${fonts}${activeThemesToCssText(themes)}
*{box-sizing:border-box}html{min-height:100%;color-scheme:light dark}body{margin:0;min-height:100dvh;background:var(--t-color-background);color:var(--t-color-foreground);font-family:var(--t-font-body);font-size:16px;line-height:1.5}main{max-width:42rem;min-height:100dvh;margin:auto;padding:4rem 1.5rem max(2rem,env(safe-area-inset-bottom));display:flex;flex-direction:column;text-align:center}.message{display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;gap:1.5rem}p,h1{margin:0}.label{font-size:.75rem;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--t-color-primary)}h1{font-family:var(--t-font-display);font-size:2.25rem;font-weight:500;line-height:1.1;text-wrap:balance}.divider{width:12rem;border:0;border-top:1px solid var(--t-color-border)}.body{max-width:28rem;color:var(--t-color-muted-foreground);text-wrap:pretty}.actions{margin-top:2.5rem}button{width:100%;min-height:3.5rem;border:0;border-radius:var(--t-radius-md);background:var(--t-color-primary);color:var(--t-color-primary-foreground);font:500 1.125rem/1.5 var(--t-font-body);padding:.75rem 1.5rem;cursor:pointer}a{display:inline-flex;align-items:center;justify-content:center;min-height:44px;margin-top:1.5rem;color:var(--t-color-primary);text-underline-offset:4px}:focus-visible{outline:2px solid var(--t-color-ring);outline-offset:4px}@media(min-width:640px){main{justify-content:center;padding-bottom:4rem}.message{flex:none}h1{font-size:3rem}button{width:auto}}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="robots" content="noindex"><title>${escape(copy.heading)}</title>${manifest.fonts.map((face) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${face.path}">`).join("")}<style>${css}</style></head><body><main><section class="message"><p class="label">${escape(copy.eyebrow)}</p><h1>${escape(copy.heading)}</h1><hr class="divider"><p class="body">${escape(copy.body)}</p></section><div class="actions"><button id="offline-retry" type="button">${escape(copy.retry)}</button></div><a href="/">${escape(copy.home)}</a></main><script>document.getElementById("offline-retry").addEventListener("click",function(){location.reload()});</script></body></html>`;
}
