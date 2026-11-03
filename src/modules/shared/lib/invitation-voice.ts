import { z } from "zod";

export const invitationVoiceSchema = z.enum(["warm", "playful", "formal"]);
export const defaultInvitationVoice = "warm" as const;
export type InvitationVoice = z.infer<typeof invitationVoiceSchema>;
