import { createRoot } from "react-dom/client";
import { GuestSnapshotScanner } from "../components/guest-snapshot-scanner";
import { OfflineScannerSession } from "../components/offline-scanner-session";

const container = document.getElementById("scanner-shell");
if (container) {
  const expiresAt = Number(container.dataset.expiresAt);
  createRoot(container).render(
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-4xl leading-tight">Gate check-in</h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          Offline scanner loaded. Open the camera when you’re ready.
        </p>
      </header>
      <OfflineScannerSession
        expiresAt={expiresAt}
        session={container.dataset.session ?? ""}
        build={container.dataset.build ?? ""}
      >
        <GuestSnapshotScanner session={container.dataset.session ?? ""} expiresAt={expiresAt} />
      </OfflineScannerSession>
    </main>,
  );
}
