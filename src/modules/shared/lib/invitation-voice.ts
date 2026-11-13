import { z } from "zod";
import { defaultInvitationVoice, invitationVoices } from "./invitation-voice-values";

export const invitationVoiceSchema = z.enum(invitationVoices);
export { defaultInvitationVoice };
export type InvitationVoice = z.infer<typeof invitationVoiceSchema>;
