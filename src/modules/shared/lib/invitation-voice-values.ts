/** Plain values, free of Zod, so browser code can import them without shipping the validator. */
export const invitationVoices = ["warm", "playful", "formal"] as const;
export const defaultInvitationVoice = "warm" as const;
export type InvitationVoice = (typeof invitationVoices)[number];
