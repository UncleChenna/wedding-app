import "server-only";
import type { PassView } from "@/modules/checkin/lib/pass-eligibility";
import { activeThemesToCssText } from "@/modules/theming/lib/css-vars";
import type { ActiveThemes } from "@/modules/theming/lib/schema";
import { qrMatrix, qrPathData, qrViewBoxSize } from "@/modules/shared/lib/qr";
import { invitationSiteCopy } from "../lib/copy";

function escape(value: string | number) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ??
      character,
  );
}
export function offlinePassResponse({
  pass,
  url,
  themes,
  refreshedAt = new Date(),
  tokenVersion,
  expiresAt,
}: {
  pass: PassView;
  url: string;
  themes: ActiveThemes;
  refreshedAt?: Date;
  tokenVersion: number;
  expiresAt: Date;
}) {
  const name = pass.names.join(" & ") || pass.householdName || "Our dear guest";
  const matrix = qrMatrix(url);
  const side = qrViewBoxSize(matrix);
  const timestamp = refreshedAt.toISOString();
  const time =
    new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(refreshedAt) + " UTC";
  const html = `<!doctype html><html lang="en" class="__OFFLINE_FONT_CLASSES__"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="referrer" content="no-referrer">
<title>Your saved entry pass</title><meta property="og:title" content="Your saved entry pass"><meta property="og:description" content="Your pass for the celebration."><meta property="og:image" content="${escape(new URL("/invitation-preview", url).href)}"><!--OFFLINE_FONT_STYLES-->
<style>
${activeThemesToCssText(themes)}
*{box-sizing:border-box}body{margin:0;background:var(--t-color-background);color:var(--t-color-foreground);font-family:var(--t-font-body),sans-serif;font-size:16px;line-height:1.6}
main{max-width:34rem;margin:auto;padding:48px 24px max(32px,env(safe-area-inset-bottom))}
.label{color:var(--t-color-primary);font-size:12px;letter-spacing:.12em;text-transform:uppercase}
h1{font-family:var(--t-font-display),serif;font-size:36px;line-height:1.2;font-weight:400;overflow-wrap:anywhere;margin:24px 0}
p{margin:24px 0}svg{display:block;width:100%;height:auto;max-width:360px}
dl{display:flex;gap:48px;margin:24px 0}dt{color:var(--t-color-primary)}dd{margin:0}
button{font:inherit;min-height:44px;min-width:44px;background:var(--t-color-primary);color:var(--t-color-primary-foreground);border:0;border-radius:var(--t-radius-md);padding:12px 24px;cursor:pointer}
button:focus-visible{outline:3px solid var(--t-color-ring);outline-offset:4px}
@media(min-width:768px){main{padding-top:64px}h1{font-size:48px}}
</style></head><body><main>
<p class="label">Saved entry pass</p><h1>${escape(name)}</h1>
<p>${escape(invitationSiteCopy.qrPass)}</p>
<svg role="img" aria-label="Entry pass QR code for ${escape(name)}" viewBox="0 0 ${side} ${side}">
<rect width="${side}" height="${side}" fill="var(--t-color-qr-paper)"></rect><path d="${qrPathData(matrix)}" fill="var(--t-color-qr-ink)"></path></svg>
<dl><div><dt>Admits</dt><dd>${pass.partySize} ${pass.partySize === 1 ? "guest" : "guests"}</dd></div><div><dt>Table</dt><dd>${pass.tableNumber ?? "To follow"}</dd></div></dl>
<p>This is your offline copy. Details may have changed since it was saved. The gate team will check your pass.</p>
<p>Last refreshed: <time datetime="${timestamp}">${escape(time)}</time></p>
<button type="button" id="refresh">Refresh pass</button><p id="connection" role="status"></p>
</main><script>
function refreshPass(){document.getElementById("connection").textContent="Checking for your latest pass…";location.reload();}
document.getElementById("refresh").addEventListener("click",refreshPass);
window.addEventListener("online",refreshPass);
</script></body></html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Wedding-Offline-Pass": "1",
      "X-Wedding-Pass-Version": String(tokenVersion),
      "X-Wedding-Offline-Refreshed": timestamp,
      "X-Wedding-Offline-Expires": expiresAt.toISOString(),
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
