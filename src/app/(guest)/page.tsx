import type { Metadata } from "next";
import { connection } from "next/server";
import { getEventSettings } from "@/modules/shared/server/settings";
import { WeddingHome } from "@/modules/invitations/components/wedding-home";
import { eventSummary } from "@/modules/invitations/lib/event-summary";

export const instant = false;
export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { title, description } = eventSummary(await getEventSettings());
  return { title, description, openGraph: { title, description } };
}
export default async function HomePage() {
  await connection();
  return <WeddingHome settings={await getEventSettings()} />;
}
