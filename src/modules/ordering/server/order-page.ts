import "server-only";
import { logger } from "@/modules/shared/lib/logger";
import { requestRetryDocument } from "@/modules/shared/server/request-retry-document";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { getEventSettings } from "@/modules/shared/server/settings";
import { resolveTableSelection } from "./table-selection";
import { findTable } from "./table-repository";
import { listMenuItems } from "./menu-repository";
import { loadMenu } from "./menu";
import { TABLE_COOKIE, tableErrors, tableErrorSchema } from "../lib/table-selection";
import { orderDocument, type OrderSelection } from "./order-document";

const asset = z.string().regex(/^\/order-assets\/order-[a-f0-9]{64}\.(js|css)$/);
const manifestSchema = z.object({ script: asset, stylesheet: asset });
export async function orderPage(request: Request) {
  try {
    return await renderOrderPage(request);
  } catch (error) {
    unstable_rethrow(error);
    logger.child({ module: "ordering" }).warn("Order page could not be loaded");
    return new Response(requestRetryDocument("ordering"), {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Retry-After": "60",
        "X-Robots-Tag": "noindex",
      },
    });
  }
}
async function renderOrderPage(request: Request) {
  const url = new URL(request.url);
  const saved = (await cookies()).get(TABLE_COOKIE)?.value;
  const selected = saved ? await resolveTableSelection(saved, findTable) : null;
  let selection: OrderSelection;
  if (url.searchParams.get("change") !== "1" && selected?.status === "selected") {
    const menu = await loadMenu(listMenuItems);
    selection = {
      kind: "menu",
      table: selected.table.number,
      items: menu.status === "ready" ? menu.items : [],
      unavailable: menu.status !== "ready",
      open: (await getEventSettings()).orderingOpen,
    };
  } else {
    const error = tableErrorSchema.safeParse(url.searchParams.get("error"));
    selection = {
      kind: "form",
      value: error.success
        ? (url.searchParams.get("table") ?? "").slice(0, 10)
        : selected?.status === "selected"
          ? String(selected.table.number)
          : "",
      notice: error.success
        ? tableErrors[error.data]
        : selected && selected.status !== "selected"
          ? selected.message
          : "",
    };
  }
  const assets = manifestSchema.parse(
    JSON.parse(await readFile(join(process.cwd(), "public/order-assets/manifest.json"), "utf8")),
  );
  return new Response(
    orderDocument({ themes: await getStoredActiveThemes(), ...assets, selection }),
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

/** Native POST/redirect/GET retains no-JavaScript table selection and origin checks. */
export async function selectOrderTable(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin)
    return new Response("Forbidden", { status: 403 });
  if (!(request.headers.get("content-type") ?? "").startsWith("application/x-www-form-urlencoded"))
    return new Response("Unsupported form", { status: 415 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024)
    return new Response("Form too large", { status: 413 });
  const body = await boundedFormBody(request);
  if (body === null) return new Response("Form too large", { status: 413 });
  const raw = new URLSearchParams(body).get("table");
  const result = await resolveTableSelection(raw, findTable);
  let location: string;
  const headers = new Headers({ "Cache-Control": "private, no-store" });
  if (result.status === "selected") {
    headers.set(
      "Set-Cookie",
      `${TABLE_COOKIE}=${result.table.number}; Path=/order; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
    location = "/order#selected-table";
  } else
    location = `/order?${new URLSearchParams({ change: "1", error: result.status, table: (raw ?? "").slice(0, 10) })}#order-table`;
  headers.set("Location", location);
  return new Response(null, { status: 303, headers });
}

/** Bound streamed bytes too: Content-Length is optional and cannot be trusted. */
async function boundedFormBody(request: Request): Promise<string | null> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 1024) {
        await reader.cancel();
        return null;
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}
