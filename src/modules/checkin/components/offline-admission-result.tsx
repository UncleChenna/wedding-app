"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import type { ScanReadResult } from "../lib/scan-read-result";
import {
  recordOfflineAttempt,
  type OfflineRecordInput,
  type OfflineRecordResponse,
} from "../browser/offline-queue-client";
import { ScanResultPanel } from "./scan-result-panel";

export function OfflineAdmissionResult({
  result,
  qr,
  manualInvitationId,
  session,
  notice,
  onBusyChange,
  onRecorded,
}: {
  result: ScanReadResult;
  qr: string | null;
  manualInvitationId?: string;
  session: string;
  notice?: string;
  onBusyChange: (busy: boolean) => void;
  onRecorded: () => void;
}) {
  const maximum =
    result.state === "valid" ? result.guest.partySize - result.guest.admittedSoFar : 50;
  const [people, setPeople] = useState(result.state === "valid" ? String(maximum) : "1");
  const [nameChecked, setNameChecked] = useState(false);
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<OfflineRecordResponse | null>(null);
  const [error, setError] = useState("");
  const intent = useRef<OfflineRecordInput | null>(null);
  const active = useRef(true);
  const inFlight = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  const uncertain = response?.state === "unavailable";
  const committed = response?.state === "recorded" || response?.state === "duplicate";
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    onBusyChange(pending || uncertain);
  }, [pending, uncertain, onBusyChange]);
  useEffect(() => {
    if (response) status.current?.focus();
  }, [response]);
  async function save() {
    if (
      inFlight.current ||
      (!qr && !manualInvitationId) ||
      (result.state !== "valid" && result.state !== "unknown")
    )
      return;
    const count = Number(people);
    if (!Number.isSafeInteger(count) || count < 1 || count > maximum) {
      setError(`Choose between 1 and ${maximum} guests.`);
      return;
    }
    if (result.state === "unknown" && !nameChecked) {
      setError("Check the guest’s name with the gate lead before continuing.");
      return;
    }
    setError("");
    const request: OfflineRecordInput = intent.current ?? {
      session,
      clientEventId: crypto.randomUUID(),
      ...(manualInvitationId
        ? { inputMethod: "manual" as const, invitationId: manualInvitationId }
        : { inputMethod: "qr" as const, qr: qr ?? "" }),
      kind: "admission",
      people: count,
      nameChecked,
    };
    intent.current = request;
    inFlight.current = true;
    setPending(true);
    onBusyChange(true);
    let next: OfflineRecordResponse;
    try {
      next = await recordOfflineAttempt(request);
    } catch {
      next = { state: "unavailable" };
    }
    inFlight.current = false;
    if (!active.current) return;
    setPending(false);
    setResponse(next);
    onBusyChange(next.state === "unavailable");
    if (next.state !== "unavailable") intent.current = null;
    if (next.state === "recorded" || next.state === "duplicate") onRecorded();
  }
  if (committed)
    return (
      <div
        ref={status}
        tabIndex={-1}
        role="status"
        className="rounded-xl space-y-4 border border-border bg-surface p-6 text-lg focus-visible:outline-2 focus-visible:outline-ring"
      >
        <h2 className="text-3xl font-semibold">
          {response.state === "recorded"
            ? "Entry saved on this phone"
            : "This entry was already saved"}
        </h2>
        <p>
          {response.people} {response.people === 1 ? "guest" : "guests"} saved on this phone. Check
          the sync status below for delivery or conflicts.
        </p>
        {response.state === "duplicate" && <p>Do not admit this group again for this receipt.</p>}
        <p>Keep this phone’s saved data until all pending records have synced.</p>
        {notice && <p>{notice}</p>}
      </div>
    );
  const canAdmit = result.state === "valid" || result.state === "unknown";
  const problem =
    response &&
    response.state !== "unavailable" &&
    response.state !== "recorded" &&
    response.state !== "duplicate"
      ? {
          refused: "This saved pass cannot admit anyone. Scan again or ask the gate lead.",
          rejected: "This request needs the gate lead’s help. No new entry was saved.",
          too_many: "Fewer places remain on this phone. Scan again before continuing.",
          bad_count: "Choose a whole number of guests.",
          full: "This phone’s saved records are full. Reconnect or use another scanner; do not clear its data.",
          refresh_required: "Reconnect and refresh the guest list before recording another entry.",
          name_check_required: "Check the guest’s name with the gate lead before continuing.",
        }[response.state]
      : null;
  return (
    <div className="space-y-4 text-lg">
      <ScanResultPanel
        state={result.state}
        guest={"guest" in result ? result.guest : undefined}
        notice={notice}
      />
      {canAdmit && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <p>
            Offline entry is saved on this phone first. Other scanners cannot see it until it syncs.
          </p>
          <div className="[&_label]:text-lg">
            <Input
              label="Guests entering now"
              className="text-lg"
              type="number"
              inputMode="numeric"
              min={1}
              max={maximum}
              value={people}
              disabled={pending || uncertain}
              onChange={(event) => setPeople(event.target.value)}
            />
          </div>
          {result.state === "unknown" && (
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                checked={nameChecked}
                disabled={pending || uncertain}
                onChange={(event) => setNameChecked(event.target.checked)}
                className="size-6"
              />
              <span>I checked this guest’s name with the gate lead.</span>
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <div
            ref={status}
            tabIndex={-1}
            className="focus-visible:outline-2 focus-visible:outline-ring"
          >
            {uncertain && (
              <p role="alert">
                The saved receipt could not be confirmed. Do not admit the group yet. Retry this
                same request; do not clear this phone’s data.
              </p>
            )}
            {problem && <p role="alert">{problem}</p>}
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? "Saving on this phone…"
              : uncertain
                ? "Retry this entry"
                : "Save offline entry"}
          </Button>
        </form>
      )}
    </div>
  );
}
