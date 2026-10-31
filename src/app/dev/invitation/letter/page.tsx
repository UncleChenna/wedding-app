import type { Metadata } from "next";
import { Suspense } from "react";
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
export default function Page(props: {
  searchParams: Promise<{ theme?: string; details?: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-6 text-lg">Preparing your invitation…</main>}>
      <Preview {...props} />
    </Suspense>
  );
}
