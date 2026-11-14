import { z } from "zod";
import { defaultInvitationVoice, invitationVoiceSchema } from "./invitation-voice";

const nonblank = z.string().trim().min(1);
const timeZone = nonblank.refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "Choose a valid event time zone");

export const eventSettingsSchema = z
  .object({
    invitationVoice: invitationVoiceSchema,
    coupleNames: z.tuple([nonblank.max(200), nonblank.max(200)]),
    eventDate: z.iso.date(),
    ceremonyTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
      .nullable(),
    timeZone: timeZone.nullable(),
    venue: nonblank.max(500).nullable(),
    mapUrl: z.url({ protocol: /^https$/ }).nullable(),
    receptionTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
      .nullable(),
    receptionVenue: nonblank.max(500).nullable(),
    receptionMapUrl: z.url({ protocol: /^https$/ }).nullable(),
    /** A phone number guests call or text to RSVP; digits, spaces, +, brackets and dashes. */
    rsvpPhone: z
      .string()
      .trim()
      .regex(/^\+?[0-9][0-9 ()-]{6,19}$/)
      .nullable(),
    dressCode: nonblank.max(500).nullable(),
    // Wi-Fi network names are at most 32 bytes and WPA passwords 8–63 characters.
    wifiName: nonblank.max(32).nullable(),
    wifiPassword: z.string().min(8).max(63).nullable(),
    rsvpLockAt: z.date().nullable(),
    orderingOpen: z.boolean(),
    activeThemeId: nonblank.max(100),
    activeDarkThemeId: nonblank.max(100),
    defaultMaxTagAlongs: z.number().int().min(0).max(10),
    retentionDays: z.number().int().min(1).max(3650),
    maxOpenOrdersPerTable: z.number().int().min(1).max(100),
    orderCooldownSeconds: z.number().int().min(0).max(86400),
    maxItemQuantity: z.number().int().min(1).max(100),
  })
  .refine((settings) => settings.rsvpLockAt === null || settings.timeZone !== null, {
    message: "Configure the venue time zone before setting the RSVP cutoff",
    path: ["rsvpLockAt"],
  });

export type EventSettings = z.infer<typeof eventSettingsSchema>;

/** The details on the printed card; anything still unknown stays null and ordering stays closed. */
export const defaultEventSettings = Object.freeze({
  invitationVoice: defaultInvitationVoice,
  coupleNames: Object.freeze(["Uchenna", "Adaora"] as const),
  eventDate: "2026-12-19",
  // From the printed invitation card (TICKET-255).
  ceremonyTime: "12:00",
  timeZone: "Africa/Lagos",
  venue: "St Paul's Anglican Church, Apo Resettlement, Abuja",
  mapUrl: null,
  receptionTime: "14:30",
  receptionVenue:
    "Fineworld Recreational Park, Events & Gardens, opposite AYM Shafa fuel station, Apo Resettlement, Abuja",
  receptionMapUrl: null,
  rsvpPhone: "09160665114",
  dressCode: null,
  wifiName: null,
  wifiPassword: null,
  // "RSVP by 17 December": replies close at 23:59 that night in Abuja (UTC+1).
  rsvpLockAt: new Date("2026-12-17T22:59:00.000Z"),
  orderingOpen: false,
  activeThemeId: "ivory-gold",
  activeDarkThemeId: "midnight-champagne",
  defaultMaxTagAlongs: 1,
  retentionDays: 90,
  maxOpenOrdersPerTable: 3,
  orderCooldownSeconds: 30,
  maxItemQuantity: 10,
});
