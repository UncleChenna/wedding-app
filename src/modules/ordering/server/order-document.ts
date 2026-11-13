import "server-only";
import {
  invitationPreviewHtml,
  type PreviewEventDetails,
} from "@/modules/invitations/lib/share-metadata";
import { defaultEventSettings } from "@/modules/shared/lib/event-settings";
import { clientEnv } from "@/modules/shared/lib/env/client";
import { activeThemesToCssText } from "@/modules/theming/lib/css-vars";
import type { ActiveThemes } from "@/modules/theming/lib/schema";
import { groupMenu, menuCopy, type MenuItem } from "../lib/menu";
import { orderCopy, ORDER_NOTE_MAX } from "../lib/order";

export type OrderSelection =
  | { kind: "form"; value: string; notice: string }
  | { kind: "menu"; table: number; items: MenuItem[]; open: boolean; unavailable: boolean };
const escape = (value: string | number) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Server-rendered public menu; no framework bootstrap or private state is serialized. */
export function orderDocument({
  themes,
  script,
  stylesheet,
  selection,
  event = defaultEventSettings,
}: {
  themes: ActiveThemes;
  script: string;
  stylesheet: string;
  selection: OrderSelection;
  event?: PreviewEventDetails;
}): string {
  const form = selection.kind === "form";
  const content = form
    ? `<form method="post" action="/order" novalidate><label for="order-table">Table number</label><input id="order-table" name="table" inputmode="numeric" autocomplete="off" enterkeyhint="go" maxlength="10" value="${escape(selection.value)}" aria-describedby="table-help${selection.notice ? " table-error" : ""}" ${selection.notice ? 'aria-invalid="true" autofocus' : ""}><p id="table-help">You'll find it on your table card.</p>${selection.notice ? `<p id="table-error" role="alert">${escape(selection.notice)}</p>` : ""}<button class="primary wide" type="submit">Confirm table</button></form>`
    : `<section aria-labelledby="selected-table"><h2 id="selected-table" tabindex="-1">Table ${selection.table}</h2><p>Your table is set for this visit.</p><a href="/order?change=1">Change table</a></section><section class="section" aria-labelledby="order-menu"><h2 id="order-menu">${menuCopy.heading}</h2>${
        selection.unavailable
          ? `<p>${menuCopy.unavailable}</p>`
          : selection.items.length === 0
            ? `<p>${menuCopy.empty}</p>`
            : `<div id="composer" data-table="${selection.table}" data-open="${selection.open}"><p id="availability-notice" class="sr-only" role="status"></p><section id="closed" ${selection.open ? "hidden" : ""}><h3>${menuCopy.closedHeading}</h3><p>${menuCopy.closed}</p></section><div id="editing" ${selection.open ? "" : "hidden"}>${groupMenu(
                selection.items,
              )
                .map(
                  (group) =>
                    `<section class="section" aria-labelledby="menu-${group.category}"><h3 class="label" id="menu-${group.category}">${group.label}</h3><ul>${group.items.map((item) => `<li data-item="${item.id}" data-name="${escape(item.name)}" data-station="${item.station}" data-available="${item.available}"><h4>${escape(item.name)}</h4>${item.description ? `<p class="muted">${escape(item.description)}</p>` : ""}${item.dietaryTags.length ? `<p>${escape(item.dietaryTags.join(" · "))}</p>` : ""}<label for="quantity-${item.id}">${escape(item.name)} quantity</label><div class="stepper"><button type="button" data-delta="-1" aria-label="Decrease ${escape(item.name)} quantity" aria-controls="quantity-${item.id}" disabled><svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 12h12" stroke-linecap="round"/></svg></button><input type="number" inputmode="numeric" id="quantity-${item.id}" min="0" max="${item.maxPerOrder}" step="1" value="0" ${item.available ? "" : `disabled aria-describedby="sold-out-${item.id}"`}><button type="button" data-delta="1" aria-label="Increase ${escape(item.name)} quantity" aria-controls="quantity-${item.id}" ${item.available ? "" : "disabled"}>+</button></div><p id="sold-out-${item.id}" data-sold-out ${item.available ? "hidden" : ""}>${menuCopy.soldOut}</p></li>`).join("")}</ul></section>`,
                )
                .join(
                  "",
                )}<div class="section"><label for="order-note">${orderCopy.noteLabel}</label><textarea id="order-note" maxlength="${ORDER_NOTE_MAX}" rows="2" aria-describedby="note-hint"></textarea><p class="muted" id="note-hint">${orderCopy.noteHint}</p></div><div class="action-bar"><p id="order-status" role="status">${orderCopy.emptyCart}</p><button type="button" id="send-order" class="primary wide" disabled>${orderCopy.send}</button></div><noscript><p>Please enable JavaScript to choose and send your order, or ask a member of the team.</p></noscript></div><section id="receipt" hidden aria-labelledby="order-sent"><h3 id="order-sent" tabindex="-1">${orderCopy.sent}</h3><div id="receipt-lines"></div><p id="receipt-note"></p><button type="button" id="another-order" class="primary">${orderCopy.another}</button></section></div>`
      }</section>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Order to your table · Our Wedding</title><meta name="description" content="Hungry? Thirsty? Order a little something to your table.">${invitationPreviewHtml(clientEnv.NEXT_PUBLIC_SITE_URL, event)}<meta name="robots" content="noindex"><link rel="manifest" href="/manifest.webmanifest"><style>${activeThemesToCssText(themes)}</style><link rel="stylesheet" href="${stylesheet}"></head><body><main><p class="label">At your table</p><h1>Hungry? Thirsty? Say the word.</h1><p>Tell us where you're sitting.</p><div class="selection">${content}</div><a href="/">Back to our day</a></main><script defer src="${script}"></script></body></html>`;
}
