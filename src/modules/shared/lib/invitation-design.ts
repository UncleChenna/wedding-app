import { z } from "zod";

export const invitationDesignInput = z
  .strictObject({
    version: z.number().int().min(0),
    photoId: z.uuid().nullable(),
    photoAlt: z.string().trim().max(500),
    headline: z.string().trim().min(1).max(200),
    subline: z.string().trim().min(1).max(1000),
  })
  .refine((value) => value.photoId === null || value.photoAlt.length > 0, {
    message: "Describe the photo for guests who cannot see it.",
    path: ["photoAlt"],
  });
export type InvitationDesignInput = z.infer<typeof invitationDesignInput>;
export interface InvitationDesignPhoto {
  id: string;
  width: number;
  height: number;
  blurDataURL: string;
}
export type InvitationDesignState =
  | { status: "idle" }
  | { status: "saved"; version: number; message: string }
  | { status: "error"; message: string };
