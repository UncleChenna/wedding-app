import type { Metadata } from "next";

import { OfflineNotice } from "@/modules/shared/components/offline-notice";

export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false },
};

/** Precached by the service worker and shown when a page cannot load offline (docs/pwa.md). */
export default function OfflinePage() {
  return <OfflineNotice />;
}
