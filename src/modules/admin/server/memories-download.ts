import "server-only";
import { z } from "zod";
import { unstable_rethrow } from "next/navigation";
import { logger } from "@/modules/shared/lib/logger";
import { getStoredActiveThemes } from "@/modules/theming/server/active-themes";
import { memoriesCsv } from "../lib/memories";
import { currentAdminAccess } from "./current-admin-access";
import { readMemories } from "./memories-repository";
import { renderMemoriesPdf } from "./memories-pdf";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const optionsSchema = z.object({
  format: z.enum(["csv", "pdf"]),
  scheme: z.enum(["light", "dark"]),
});

export async function memoriesDownload(
  request: Request,
  context: { params: Promise<{ format: string }> },
) {
  try {
    // Layout/proxy protection is not sufficient for a direct route invocation.
    if ((await currentAdminAccess()).status !== "ready")
      return new Response("Please complete two-step sign-in first.", { status: 403, headers });
    const { format } = await context.params;
    const options = optionsSchema.safeParse({
      format,
      scheme: new URL(request.url).searchParams.get("scheme") ?? "light",
    });
    if (!options.success)
      return new Response("Choose a PDF or CSV download.", { status: 400, headers });
    const data = await readMemories();
    const isPdf = options.data.format === "pdf";
    const body = isPdf
      ? new Uint8Array(
          await renderMemoriesPdf(data, (await getStoredActiveThemes())[options.data.scheme]),
        )
      : memoriesCsv(data);
    return new Response(body, {
      headers: {
        ...headers,
        "Content-Type": isPdf ? "application/pdf" : "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wedding-memories.${options.data.format}"`,
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    logger.child({ module: "memories" }).error("Memories export unavailable");
    return new Response("We couldn't prepare your memories. Please try again shortly.", {
      status: 503,
      headers,
    });
  }
}
