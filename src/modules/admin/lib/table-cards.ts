import { appRoutes } from "@/modules/shared/lib/routes";

export interface TableCard {
  number: number;
  name: string | null;
}

export interface TableCardWifi {
  name: string;
  password: string | null;
}

/** One card per table, lowest number first; blank names are left off the card. */
export function buildTableCards(
  tables: readonly { number: number; name: string | null }[],
): TableCard[] {
  return [...tables]
    .sort((a, b) => a.number - b.number)
    .map(({ number, name }) => ({ number, name: name?.trim() ? name.trim() : null }));
}

/** Every card shares one QR: guests choose their table on the order page itself. */
export function orderUrl(siteUrl: string): string {
  return new URL(appRoutes.order.path, siteUrl).toString();
}

/** Wi-Fi is printed only once the network name is set; an open network has no password. */
export function wifiDetails(settings: {
  wifiName: string | null;
  wifiPassword: string | null;
}): TableCardWifi | null {
  return settings.wifiName ? { name: settings.wifiName, password: settings.wifiPassword } : null;
}
