import "server-only";
import { serverEnv } from "@/modules/shared/server/env";
import { whatsAppConfigSchema } from "./whatsapp";

/** Partial or absent provider configuration never consumes the outbox. */
export function whatsAppConfig() {
  const parsed = whatsAppConfigSchema.safeParse({
    accessToken: serverEnv.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: serverEnv.WHATSAPP_PHONE_NUMBER_ID,
    apiVersion: serverEnv.WHATSAPP_API_VERSION,
    template: serverEnv.WHATSAPP_ALERT_TEMPLATE,
    language: serverEnv.WHATSAPP_TEMPLATE_LANGUAGE,
  });
  return parsed.success ? parsed.data : null;
}
