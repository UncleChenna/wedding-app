import type { QrGeometry } from "@/modules/shared/components/ui/qr-mark";
export type MfaState =
  | { status: "idle" | "error" | "verified"; message: string }
  | { status: "setup"; message: string; setup: { id: string; secret: string; qr: QrGeometry } };
export const initialMfaState: MfaState = { status: "idle", message: "" };
