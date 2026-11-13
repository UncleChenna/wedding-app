import "server-only";
import { serverEnv } from "@/modules/shared/server/env";

export function staffPushConfig() {
  const {
    WEB_PUSH_PUBLIC_KEY: publicKey,
    WEB_PUSH_PRIVATE_KEY: privateKey,
    WEB_PUSH_SUBJECT: subject,
  } = serverEnv;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}
