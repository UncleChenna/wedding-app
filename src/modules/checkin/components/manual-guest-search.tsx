"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import {
  manualRequestSchema,
  type ManualLookupRequest,
  type ManualResponse,
} from "../lib/manual-checkin";
import { AdmissionResult } from "./admission-result";
import { ScanResultPanel } from "./scan-result-panel";
import type { AdmissionResponse } from "../lib/online-admission";

export type ManualLookup = (
  input: ManualLookupRequest,
  signal: AbortSignal,
) => Promise<{
  response: ManualResponse;
  cached: boolean;
}>;

/** Names live only in this session-bound view; returning online never authorizes a cached selection. */
export function ManualGuestSearch({
  lookup,
  onClose,
  onAdmissionRecorded,
  onAdmissionOutcome,
  staleNotice,
}: {
  lookup: ManualLookup;
  onClose: () => void;
  onAdmissionRecorded?: () => void;
  onAdmissionOutcome?: (response: AdmissionResponse) => void;
  staleNotice?: string;
}) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Awaited<ReturnType<ManualLookup>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const operation = useRef<AbortController | null>(null);
  const region = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => {
    field.current?.focus();
    return () => operation.current?.abort();
  }, []);
  useEffect(() => {
    if (answer) region.current?.focus();
  }, [answer]);

  function reset() {
    operation.current?.abort();
    operation.current = null;
    setAnswer(null);
    setLoading(false);
    setError("");
  }
  async function run(input: ManualLookupRequest) {
    reset();
    const controller = new AbortController();
    operation.current = controller;
    setLoading(true);
    try {
      const result = await lookup(input, controller.signal);
      if (operation.current === controller && !controller.signal.aborted) setAnswer(result);
    } catch {
      if (operation.current === controller && !controller.signal.aborted)
        setError("Guest search is unavailable. Try again or ask the gate lead for help.");
    } finally {
      if (operation.current === controller) {
        operation.current = null;
        setLoading(false);
      }
    }
  }
  const response = answer?.response;
  return (
    <section
      aria-labelledby="manual-search-title"
      className="flex flex-col gap-6 text-lg leading-relaxed"
    >
      <header className="flex flex-col gap-2">
        <h2 id="manual-search-title" className="font-display text-3xl">
          Find a guest
        </h2>
        <p>Search the guest’s name or a companion’s name, then confirm the household.</p>
      </header>
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = manualRequestSchema.safeParse({ operation: "search", query });
          if (!parsed.success || parsed.data.operation !== "search") {
            setError("Enter at least two letters of the guest’s name.");
            return;
          }
          void run(parsed.data);
        }}
      >
        <label htmlFor="manual-guest-name">Guest name</label>
        <input
          ref={field}
          id="manual-guest-name"
          value={query}
          maxLength={200}
          autoComplete="off"
          disabled={busy}
          className="min-h-11 rounded-md border border-input bg-background px-3 py-2 text-lg focus-visible:outline-2 focus-visible:outline-ring"
          onChange={(event) => {
            reset();
            setQuery(event.target.value);
          }}
        />
        <Button size="lg" type="submit" disabled={loading || busy}>
          Find guest
        </Button>
      </form>
      <div role="status" aria-live="polite">
        {loading ? "Finding guest…" : error}
      </div>
      <div
        ref={region}
        tabIndex={-1}
        className="flex flex-col gap-4 focus-visible:outline-2 focus-visible:outline-ring"
      >
        {answer?.cached && (
          <p>
            Using the saved guest list. No entry is recorded offline. Reconnect and select the guest
            again before recording entry.
          </p>
        )}
        {response?.state === "matches" && (
          <>
            <h3 className="font-display text-2xl">
              {response.matches.length ? "Choose the household" : "No matching guests"}
            </h3>
            {response.matches.length === 0 && (
              <p>Try another part of the name or ask the gate lead to check the invitation.</p>
            )}
            <ul className="flex flex-col gap-3">
              {response.matches.map((match) => (
                <li key={match.invitationId}>
                  <button
                    type="button"
                    className="hover:bg-muted flex min-h-11 w-full flex-col gap-1 rounded-md border border-border p-4 text-left text-lg break-words focus-visible:outline-2 focus-visible:outline-ring"
                    onClick={() =>
                      void run({ operation: "read", invitationId: match.invitationId })
                    }
                  >
                    <span className="font-medium">{match.name}</span>
                    {match.matchedName !== match.name && (
                      <span>Matched name: {match.matchedName}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {response.hasMore && (
              <p>More households match. Add another part of the name to narrow the search.</p>
            )}
          </>
        )}
        {answer?.cached && staleNotice && <p role="status">{staleNotice}</p>}
        {response?.state === "selection" &&
          (answer?.cached ? (
            <ScanResultPanel
              state={response.result.state}
              guest={"guest" in response.result ? response.result.guest : undefined}
            />
          ) : (
            <AdmissionResult
              key={`${response.invitationId}:${response.version}`}
              result={response.result}
              qr={null}
              manual={{ invitationId: response.invitationId, version: response.version }}
              onBusyChange={setBusy}
              onComplete={onAdmissionRecorded}
              onOutcome={onAdmissionOutcome}
            />
          ))}
        {response?.state === "session_expired" && (
          <p>Your session has ended. Sign in again before searching.</p>
        )}
        {response?.state === "unavailable" && (
          <p>Guest search is unavailable. Try again or ask the gate lead for help.</p>
        )}
        {response?.state === "invalid" && (
          <p>This selection is unavailable. Search again before continuing.</p>
        )}
      </div>
      <Button size="lg" variant="secondary" disabled={busy} onClick={onClose}>
        Back to camera
      </Button>
    </section>
  );
}
