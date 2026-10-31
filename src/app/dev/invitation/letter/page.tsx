import type { Metadata } from "next";
import { connection } from "next/server";

export const instant = false;
import { InvitationLetterPreview } from "@/modules/invitations/components/invitation-letter-preview";

export const metadata: Metadata = {
  title: "Personal invitation preview",
  robots: { index: false },
};
async function Preview({
  searchParams,
}: {
  searchParams: Promise<{ theme?: string; details?: string }>;
}) {
  const params = await searchParams;
  return (
    <InvitationLetterPreview selectedTheme={params.theme} sample={params.details === "sample"} />
  );
}
export default async function Page(props: {
  searchParams: Promise<{ theme?: string; details?: string }>;
}) {
  await connection();
  return <Preview {...props} />;
}
