import "server-only";
import { z } from "zod";

export const whatsAppConfigSchema = z.object({
  accessToken: z
    .string()
    .min(1)
    .max(4096)
    .regex(/^[^\s]+$/),
  phoneNumberId: z.string().regex(/^\d{1,30}$/),
  apiVersion: z.string().regex(/^v\d{1,3}\.0$/),
  template: z.string().regex(/^[a-z0-9_]{1,512}$/),
  language: z.string().regex(/^[a-z]{2,3}(?:_[A-Z]{2})?$/),
});
export type WhatsAppConfig = z.infer<typeof whatsAppConfigSchema>;
export type WhatsAppOutcome = "accepted" | "failed" | "uncertain" | "skipped";
const messageSchema = z.object({
  number: z.string().regex(/^\+[1-9]\d{7,14}$/),
  text: z.string().min(1).max(1024),
});
const acceptanceSchema = z.object({
  messages: z.array(z.object({ id: z.string().min(1).max(512) })).length(1),
});
const rejectionSchema = z.object({ error: z.object({ code: z.int() }) });
// Only explicit Graph rejections are retryable. A bare HTTP 5xx can hide acceptance.
const transientCodes = new Set([1, 2, 131000, 131016, 130429]);

type Dependencies = {
  eligible: () => Promise<boolean>;
  deadline?: number;
  fetcher?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
};

/** API acceptance is not delivery. Never log provider bodies, tokens, numbers or order notes. */
export async function sendWhatsAppTemplate(
  config: WhatsAppConfig,
  message: { number: string; text: string },
  dependencies: Dependencies,
): Promise<WhatsAppOutcome> {
  if (!whatsAppConfigSchema.safeParse(config).success || !messageSchema.safeParse(message).success)
    return "failed";
  const fetcher = dependencies.fetcher ?? fetch;
  const sleep =
    dependencies.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 4; attempt++) {
    if (Date.now() >= (dependencies.deadline ?? Number.POSITIVE_INFINITY)) return "failed";
    if (!(await dependencies.eligible())) return "skipped";
    const remaining = (dependencies.deadline ?? Number.POSITIVE_INFINITY) - Date.now();
    if (remaining <= 0) return "failed";
    try {
      const response = await fetcher(
        `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          redirect: "error",
          cache: "no-store",
          signal: AbortSignal.timeout(Math.min(5_000, remaining)),
          headers: {
            authorization: `Bearer ${config.accessToken}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: message.number.slice(1),
            type: "template",
            template: {
              name: config.template,
              language: { code: config.language },
              components: [
                {
                  type: "body",
                  parameters: [{ type: "text", text: message.text.replace(/[\r\n\t]+/g, " ") }],
                },
              ],
            },
          }),
        },
      );
      const body: unknown = await response.json();
      if (response.ok) return acceptanceSchema.safeParse(body).success ? "accepted" : "uncertain";
      const rejection = rejectionSchema.safeParse(body);
      if (!rejection.success) return "uncertain";
      if (!transientCodes.has(rejection.data.error.code) || attempt === 3) return "failed";
      const retryAfter = response.headers.get("retry-after");
      const requestedDelay = retryAfter ? Number(retryAfter) * 1000 : 0;
      // Do not violate a long/unknown provider backoff or hold a route open indefinitely.
      if (!Number.isFinite(requestedDelay) || requestedDelay > 5_000 || requestedDelay < 0)
        return "failed";
      const delay = Math.max(500 * 2 ** attempt, requestedDelay);
      if (Date.now() + delay >= (dependencies.deadline ?? Number.POSITIVE_INFINITY))
        return "failed";
      await sleep(delay);
    } catch {
      // The provider may already have accepted this POST. No automatic replay.
      return "uncertain";
    }
  }
  return "failed";
}
