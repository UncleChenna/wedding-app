"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/modules/shared/components/ui/button";
import { Card } from "@/modules/shared/components/ui/card";
import { appRoutes } from "@/modules/shared/lib/routes";
import { healthSnapshotSchema, type HealthSnapshot } from "../lib/health";

export function AdminHealth() {
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "denied">("loading");
  const refreshRef = useRef<() => void>(() => {});
  useEffect(() => {
    let active = true,
      generation = 0,
      denied = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const refresh = async () => {
      clearTimeout(timer);
      controller?.abort();
      const current = ++generation;
      if (!active || denied || document.hidden) return;
      controller = new AbortController();
      try {
        const response = await fetch("/api/admin/health", {
          cache: "no-store",
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        });
        if (!active || current !== generation) return;
        if (response.status === 401 || response.status === 403) {
          denied = true;
          setSnapshot(null);
          setState("denied");
          return;
        }
        const parsed = healthSnapshotSchema.safeParse(response.ok ? await response.json() : null);
        if (!active || current !== generation) return;
        if (parsed.success) {
          setSnapshot(parsed.data);
          setState("ready");
        } else {
          setSnapshot(null);
          setState("unavailable");
        }
      } catch {
        if (!active || current !== generation) return;
        setSnapshot(null);
        setState("unavailable");
      }
      timer = setTimeout(() => void refresh(), 15000);
    };
    const visible = () => void refresh();
    refreshRef.current = () => {
      setState("loading");
      void refresh();
    };
    document.addEventListener("visibilitychange", visible);
    void refresh();
    return () => {
      active = false;
      ++generation;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-lg leading-relaxed">
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Event health</h1>
      <p className="mt-6 max-w-prose">A quick check of the services supporting your celebration.</p>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p role="status">
          {state === "loading"
            ? "Checking services…"
            : state === "denied"
              ? "Please sign in again to view event health."
              : state === "unavailable"
                ? "Health checks could not refresh. Service status is unknown."
                : "Checks refresh every 15 seconds while this page is visible."}
        </p>
        {state === "denied" ? (
          <Link
            className="inline-flex min-h-11 items-center text-primary underline"
            href={appRoutes.adminSignIn.path}
          >
            Sign in
          </Link>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            disabled={state === "loading"}
            onClick={() => refreshRef.current()}
          >
            Refresh health
          </Button>
        )}
      </div>
      {snapshot && state !== "denied" ? <HealthDetails snapshot={snapshot} /> : null}
      <Link
        className="mt-8 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        href={appRoutes.admin.path}
      >
        Back to control room
      </Link>
    </main>
  );
}
function HealthCard({
  title,
  label,
  tone,
  children,
}: {
  title: string;
  label: string;
  tone: "good" | "warning" | "bad";
  children: React.ReactNode;
}) {
  const style =
    tone === "good"
      ? "bg-success-subtle text-success-subtle-foreground"
      : tone === "bad"
        ? "bg-danger-subtle text-danger-subtle-foreground"
        : "bg-warning-subtle text-warning-subtle-foreground";
  return (
    <Card className="p-6 shadow-none">
      <h2 className="font-display text-3xl">{title}</h2>
      <p className={`mt-4 inline-block rounded-sm px-3 py-2 font-semibold ${style}`}>{label}</p>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
export function HealthDetails({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <>
      <p className="mt-6">
        Last check:{" "}
        <time dateTime={snapshot.checkedAt}>
          {new Date(snapshot.checkedAt).toLocaleTimeString("en-GB")}
        </time>
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <HealthCard
          title="Database"
          label={snapshot.database === "ready" ? "Available" : "Unavailable"}
          tone={snapshot.database === "ready" ? "good" : "bad"}
        >
          <p>
            {snapshot.database === "ready"
              ? "The latest database query completed."
              : "Could not reach event data. Keep offline scanners open and check the connection."}
          </p>
        </HealthCard>
        <HealthCard
          title="Live updates"
          label={
            snapshot.realtime === "configured"
              ? "Broadcast support found"
              : snapshot.realtime === "unavailable"
                ? "Not available"
                : "Unknown"
          }
          tone={snapshot.realtime === "unavailable" ? "bad" : "warning"}
        >
          <p>
            The server checks broadcast support. Each gate, kitchen and bar screen reports its own
            live connection; open those screens to confirm delivery.
          </p>
        </HealthCard>
        <HealthCard
          title="Alert outbox"
          label={
            !snapshot.outbox
              ? "Unknown"
              : snapshot.outbox.failed
                ? "Delivery needs attention"
                : snapshot.outbox.pending
                  ? "Waiting to send"
                  : "Queue clear"
          }
          tone={
            snapshot.outbox?.failed
              ? "bad"
              : !snapshot.outbox || snapshot.outbox.pending
                ? "warning"
                : "good"
          }
        >
          <p>
            {snapshot.outbox
              ? `${snapshot.outbox.pending} pending · ${snapshot.outbox.failed} failed`
              : "Counts are unavailable while event data cannot be read."}
          </p>
          <p className="mt-3">A clear queue does not confirm alerts reached a phone.</p>
        </HealthCard>
        <HealthCard title="Offline check-ins" label="Check each scanner" tone="warning">
          <p>
            Pending events stay on each scanner. This screen cannot see disconnected devices, so an
            unknown queue is never shown as empty.
          </p>
          <p className="mt-3">
            {snapshot.lastSync ? (
              <>
                Last received offline event:{" "}
                <time dateTime={snapshot.lastSync}>
                  {new Date(snapshot.lastSync).toLocaleString("en-GB")}
                </time>
                .
              </>
            ) : (
              "No received offline event is available from this check."
            )}
          </p>
          <Link
            className="mt-3 inline-flex min-h-11 items-center text-primary underline underline-offset-4"
            href={appRoutes.adminScans.path}
          >
            Open scan log
          </Link>
        </HealthCard>
      </div>
      <p className="mt-8">
        Deployed version: <span className="font-semibold break-all">{snapshot.version}</span>
      </p>
    </>
  );
}
