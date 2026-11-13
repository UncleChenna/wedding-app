import Link from "next/link";
import { appRoutes } from "@/modules/shared/lib/routes";
import { getEventSettings } from "@/modules/shared/server/settings";
import { settingsCopy, utcToZonedLocal } from "../lib/settings-form";
import { requireAdminPageAccess } from "../server/current-admin-access";
import { SettingsForm, type SettingsDefaults } from "./settings-form";

/** One place for every event setting (TICKET-101). */
export async function AdminSettings() {
  await requireAdminPageAccess();
  const settings = await getEventSettings();
  const defaults: SettingsDefaults = {
    partnerOne: settings.coupleNames[0],
    partnerTwo: settings.coupleNames[1],
    eventDate: settings.eventDate,
    ceremonyTime: settings.ceremonyTime?.slice(0, 5) ?? "",
    timeZone: settings.timeZone ?? "",
    venue: settings.venue ?? "",
    mapUrl: settings.mapUrl ?? "",
    dressCode: settings.dressCode ?? "",
    wifiName: settings.wifiName ?? "",
    wifiPassword: settings.wifiPassword ?? "",
    rsvpLockAt:
      settings.rsvpLockAt && settings.timeZone
        ? utcToZonedLocal(settings.rsvpLockAt, settings.timeZone)
        : "",
    invitationVoice: settings.invitationVoice,
    defaultMaxTagAlongs: String(settings.defaultMaxTagAlongs),
    retentionDays: String(settings.retentionDays),
    maxOpenOrdersPerTable: String(settings.maxOpenOrdersPerTable),
    orderCooldownSeconds: String(settings.orderCooldownSeconds),
    maxItemQuantity: String(settings.maxItemQuantity),
  };
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">{settingsCopy.heading}</h1>
      <p className="mt-6 max-w-prose">{settingsCopy.intro}</p>
      <Link
        href={appRoutes.adminThemes.path}
        className="mt-6 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        Edit colours and fonts
      </Link>
      <SettingsForm defaults={defaults} />
    </main>
  );
}
