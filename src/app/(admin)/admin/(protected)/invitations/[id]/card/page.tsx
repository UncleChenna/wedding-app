import { Suspense } from "react";
import { AdminCardPreview } from "@/modules/admin/components/admin-card-preview";
export const metadata = {
  title: "Invitation card preview",
  robots: { index: false, follow: false },
};
export default function CardPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <main className="p-6" role="status">
          Preparing the card…
        </main>
      }
    >
      <AdminCardPreview params={params} />
    </Suspense>
  );
}
