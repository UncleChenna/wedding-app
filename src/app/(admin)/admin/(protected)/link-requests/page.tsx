import type { Metadata } from "next";
import { LinkRequests } from "@/modules/admin/components/link-requests";
export const metadata: Metadata = {
  title: "Invitation requests",
  robots: { index: false, follow: false },
};
export default async function LinkRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  return <LinkRequests page={page} />;
}
