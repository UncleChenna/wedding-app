import { z } from "zod";

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
    coupleNames: z.tuple([nonblank.max(200), nonblank.max(200)]),
    eventDate: z.iso.date(),
    ceremonyTime: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
      .nullable(),
    timeZone: timeZone.nullable(),
    venue: nonblank.max(500).nullable(),
    mapUrl: z.url({ protocol: /^https$/ }).nullable(),
    dressCode: nonblank.max(500).nullable(),
    rsvpLockAt: z.date().nullable(),
    orderingOpen: z.boolean(),
    activeThemeId: nonblank.max(100),
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

/** Approved draft values; unknown event details stay unknown and ordering stays closed. */
export const defaultEventSettings = Object.freeze({
  coupleNames: Object.freeze(["Uchenna", "Adaora"] as const),
  eventDate: "2026-12-19",
  ceremonyTime: null,
  timeZone: null,
  venue: null,
  mapUrl: null,
  dressCode: null,
  rsvpLockAt: null,
  orderingOpen: false,
  activeThemeId: "ivory-gold",
  defaultMaxTagAlongs: 1,
  retentionDays: 90,
  maxOpenOrdersPerTable: 3,
  orderCooldownSeconds: 30,
  maxItemQuantity: 10,
});
