"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/modules/shared/components/ui/button";
import { Card } from "@/modules/shared/components/ui/card";
import { dashboardMetrics, type DashboardSnapshot } from "../lib/dashboard";
import { fetchDashboard } from "../lib/dashboard-fetch";

export function LiveDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "live" | "stale" | "denied">("loading");
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let active = true;
    let denied = false;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const cancel = () => {
      generation++;
      clearTimeout(timer);
      controller?.abort();
    };
    const refresh = async () => {
      cancel();
      if (!active || denied || document.hidden) return;
      const current = generation;
      controller = new AbortController();
      const result = await fetchDashboard(controller.signal);
      if (!active || current !== generation) return;
      if (result.status === "denied") {
        denied = true;
        setSnapshot(null);
        setStatus("denied");
        return;
      }
      if (result.status === "ready") {
        setSnapshot(result.snapshot);
        setStatus("live");
      } else setStatus("stale");
      timer = setTimeout(() => {
        void refresh();
      }, 1000);
    };
    const visible = () => {
      if (document.hidden) cancel();
      else void refresh();
    };
    const online = () => {
      void refresh();
    };
    const offline = () => {
      cancel();
      if (!denied) setStatus("stale");
    };
    refreshRef.current = online;
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    void refresh();
    return () => {
      active = false;
      cancel();
      refreshRef.current = () => {};
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  const message =
    status === "denied"
      ? "Please sign in again to view your counts."
      : status === "stale"
        ? snapshot
          ? "Updates paused. Showing the last received counts."
          : "Your counts couldn’t load. Please try again."
        : status === "loading"
          ? snapshot
            ? "Refreshing your counts…"
            : "Loading your counts…"
          : "Updating automatically while this page is open.";

  return (
    <section className="mt-12" aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading" className="font-display text-3xl">
        Live dashboard
      </h2>
      <div className="mt-4 flex min-h-24 flex-wrap items-start justify-between gap-4">
        <p role="status" className="max-w-prose text-lg leading-relaxed">
          {message}
        </p>
        {status === "denied" ? (
          <Link
            href="/admin/sign-in"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            Sign in
          </Link>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setStatus("loading");
              refreshRef.current();
            }}
          >
            Refresh counts
          </Button>
        )}
      </div>
      <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {dashboardMetrics.map((metric) => (
          <Card key={metric.key} className="p-6 shadow-none">
            <dt className="text-lg font-medium">{metric.label}</dt>
            <dd
              className="mt-3 font-display text-5xl leading-tight tabular-nums"
              data-counter={metric.key}
            >
              {snapshot ? (
                snapshot[metric.key].toLocaleString("en-GB")
              ) : (
                <span aria-label="Not available">—</span>
              )}
            </dd>
            <dd className="mt-3 text-lg leading-relaxed text-muted-foreground">{metric.detail}</dd>
          </Card>
        ))}
      </dl>
    </section>
  );
}
