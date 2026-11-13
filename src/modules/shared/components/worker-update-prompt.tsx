"use client";
import type { UpdateView } from "../browser/worker-update-client";
import { Button, Card, CardContent } from "./ui";

export function WorkerUpdatePrompt({
  value,
  onReload,
  onLater,
}: {
  value: UpdateView;
  onReload(): void;
  onLater(): void;
}) {
  if (value.state === "hidden") return null;
  const message =
    value.state === "deferred"
      ? "Saved check-ins still need attention. Finish syncing or ask the gate lead before updating."
      : value.state === "unavailable"
        ? "We couldn’t check your saved entries. Keep this page open and try again shortly."
        : value.state === "updating"
          ? "Preparing your update. Keep this page open."
          : value.state === "checking"
            ? "Checking your saved entries…"
            : "A fresh version is ready. Reload when you’ve finished what you’re doing.";
  return (
    <aside
      aria-label="Site update"
      className="mx-auto w-full max-w-3xl p-4 text-lg leading-relaxed"
    >
      <Card>
        <CardContent className="space-y-4">
          <p className="font-semibold">Update available</p>
          <p role="status">{message}</p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="text-lg"
              disabled={value.state !== "ready"}
              onClick={onReload}
            >
              {value.state === "updating" ? "Updating…" : "Reload"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="text-lg"
              disabled={value.state === "updating"}
              onClick={onLater}
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

/** Inert theme examples: preview controls never activate a service worker. */
export function WorkerUpdateExamples() {
  return (
    <div data-update-examples>
      <WorkerUpdatePrompt
        value={{ state: "ready", pending: 0 }}
        onReload={() => {}}
        onLater={() => {}}
      />
      <WorkerUpdatePrompt
        value={{ state: "deferred", pending: 2 }}
        onReload={() => {}}
        onLater={() => {}}
      />
    </div>
  );
}
