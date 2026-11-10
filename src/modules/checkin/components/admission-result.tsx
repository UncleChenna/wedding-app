"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { Input } from "@/modules/shared/components/ui/input";
import { Card, CardContent } from "@/modules/shared/components/ui/card";
import { StatusBadge } from "@/modules/shared/components/ui/status-panel";
import { invitationSiteCopy } from "@/modules/invitations/lib/copy";
import {
  admissionResponseSchema,
  type AdmissionRequest,
  type AdmissionResponse,
} from "../lib/online-admission";
import type { ScanReadResult } from "../lib/scan-read-result";
import { ScanResultPanel } from "./scan-result-panel";

export type AdmissionSubmitter = (
  input: AdmissionRequest,
  signal: AbortSignal,
) => Promise<AdmissionResponse>;
async function submitLive(
  input: AdmissionRequest,
  signal: AbortSignal,
): Promise<AdmissionResponse> {
  const transport = new AbortController();
  const abort = () => transport.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  // A transport timeout is uncertain, not proof that the transaction rolled back.
  // Keep the component's intent alive so retry uses exactly the same event ID.
  const timeout = setTimeout(abort, 8000);
  try {
    const response = await fetch("/api/checkin/admit", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      signal: transport.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (response.status === 403) return { state: "session_expired" };
    const parsed = admissionResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : { state: "unavailable" };
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}

const refusal = {
  invalid: "This pass cannot be admitted. Scan again or ask the gate lead for help.",
  revoked: "This pass has been revoked or replaced. Ask the gate lead to check.",
  not_rsvped: "An attending reply is needed before admission. Ask the gate lead to check.",
  already_used: "All places have already been admitted. Ask the gate lead to check.",
  conflict: "This request was already used for a different action. Scan again before continuing.",
  session_expired: "Your session has ended. Sign in again before admitting anyone.",
} as const;

export function AdmissionResult({
  result,
  qr,
  submit = submitLive,
  onBusyChange,
  onComplete,
  allowAdmission = true,
}: {
  result: ScanReadResult;
  qr: string | null;
  submit?: AdmissionSubmitter;
  onBusyChange: (busy: boolean) => void;
  onComplete?: () => void;
  allowAdmission?: boolean;
}) {
  const remaining =
    result.state === "valid" ? result.guest.partySize - result.guest.admittedSoFar : 0;
  const [people, setPeople] = useState(String(remaining));
  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<AdmissionResponse | null>(null);
  const [validation, setValidation] = useState("");
  const intent = useRef<AdmissionRequest | null>(null);
  const controller = useRef<AbortController | null>(null);
  const receipt = useRef<HTMLDivElement>(null);
  const uncertain = response?.state === "unavailable";
  const committed = response?.state === "recorded" || response?.state === "duplicate";
  useEffect(() => {
    onBusyChange(pending || uncertain);
  }, [pending, uncertain, onBusyChange]);
  useEffect(() => {
    if (response && !uncertain) receipt.current?.focus();
  }, [response, uncertain]);
  useEffect(() => () => controller.current?.abort(), []);

  async function admit() {
    if (
      controller.current ||
      !qr ||
      result.state !== "valid" ||
      (!allowAdmission && !intent.current)
    )
      return;
    const selected = Number(people);
    if (!Number.isSafeInteger(selected) || selected < 1 || selected > remaining) {
      setValidation(`Choose between 1 and ${remaining} guests.`);
      return;
    }
    setValidation("");
    const request = intent.current ?? { clientEventId: crypto.randomUUID(), qr, people: selected };
    intent.current = request;
    const current = new AbortController();
    controller.current = current;
    setPending(true);
    onBusyChange(true);
    let next: AdmissionResponse;
    try {
      next = await submit(request, current.signal);
    } catch {
      next = { state: "unavailable" };
    }
    if (current.signal.aborted) return;
    const parsed = admissionResponseSchema.safeParse(next);
    next = parsed.success ? parsed.data : { state: "unavailable" };
    controller.current = null;
    setPending(false);
    setResponse(next);
    onBusyChange(next.state === "unavailable");
    if (next.state !== "unavailable") intent.current = null;
    if (next.state === "recorded" || next.state === "duplicate") onComplete?.();
  }
  function adjust(delta: number) {
    const current = Number(people);
    setPeople(
      String(Math.min(remaining, Math.max(1, (Number.isFinite(current) ? current : 1) + delta))),
    );
  }

  if (response && !uncertain) {
    const duplicate = response.state === "duplicate";
    const recorded = response.state === "recorded";
    const problem = ["invalid", "revoked", "conflict", "session_expired"].includes(response.state);
    return (
      <div
        ref={receipt}
        tabIndex={-1}
        className="focus-visible:outline-2 focus-visible:outline-ring"
      >
        <Card role="status" aria-live="polite">
          <CardContent className="flex flex-col gap-6 text-lg leading-relaxed">
            <StatusBadge
              tone={recorded ? "success" : problem ? "danger" : "warning"}
              icon={recorded ? "check" : problem ? "cross" : "clock"}
            >
              {committed ? "Recorded receipt" : "Not admitted"}
            </StatusBadge>
            <h2 className="font-display text-4xl leading-tight">
              {recorded ? "Admission recorded" : duplicate ? "Already recorded" : "Please check"}
            </h2>
            {recorded && (
              <>
                <p>
                  {response.tableNumber === null
                    ? `Welcome, ${response.name}.`
                    : invitationSiteCopy.gateValid
                        .replace("{GuestName}", response.name)
                        .replace("{N}", String(response.tableNumber))}
                </p>
                {response.tableNumber === null && (
                  <p>Table not assigned. Ask the gate lead for your table.</p>
                )}
                <p className="text-3xl font-semibold">
                  {response.people} {response.people === 1 ? "guest" : "guests"} admitted
                </p>
                <p>
                  {response.admittedSoFar} admitted so far · {response.remaining} remaining
                </p>
              </>
            )}
            {duplicate && (
              <p>
                This request already recorded {response.people}{" "}
                {response.people === 1 ? "guest" : "guests"}. Do not admit them again from this
                receipt.
              </p>
            )}
            {(recorded || duplicate) && (
              <p>
                Recorded{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                }).format(new Date(response.recordedAt))}{" "}
                UTC
              </p>
            )}
            {response.state === "too_many" && (
              <p>
                Only {response.remaining}{" "}
                {response.remaining === 1 ? "place remains" : "places remain"}. No one was admitted
                by this request. Scan again to check the current count.
              </p>
            )}
            {response.state in refusal && <p>{refusal[response.state as keyof typeof refusal]}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }
  if (result.state !== "valid" || !qr || (!allowAdmission && !response && !pending))
    return (
      <ScanResultPanel state={result.state} guest={"guest" in result ? result.guest : undefined} />
    );
  return (
    <Card>
      <CardContent className="flex flex-col gap-6 text-lg leading-relaxed [&_input]:text-lg [&_label]:text-lg">
        <div className="flex flex-col gap-3">
          <StatusBadge tone="success" icon="check">
            Pass check
          </StatusBadge>
          <h2 className="font-display text-4xl leading-tight">Valid pass</h2>
          <p className="font-display text-3xl leading-tight wrap-anywhere">{result.guest.name}</p>
          <p className="text-3xl font-semibold">
            {result.guest.tableNumber === null
              ? "Table not assigned"
              : `Table ${result.guest.tableNumber}`}
          </p>
          <p>
            Party of {result.guest.partySize} · {result.guest.admittedSoFar} admitted so far
          </p>
          <p>No admission has been recorded by this check.</p>
        </div>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void admit();
          }}
          aria-label="Admit arriving guests"
        >
          <div className="flex items-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="shrink-0 px-4"
              aria-label="One fewer guest"
              disabled={pending || uncertain || Number(people) <= 1}
              onClick={() => adjust(-1)}
            >
              −
            </Button>
            <div className="min-w-0 flex-1">
              <Input
                label="How many are here?"
                className="min-w-0 text-center"
                type="number"
                inputMode="numeric"
                min={1}
                max={remaining}
                required
                value={people}
                disabled={pending || uncertain}
                onChange={(event) => setPeople(event.target.value)}
                error={validation || undefined}
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="shrink-0 px-4"
              aria-label="One more guest"
              disabled={pending || uncertain || Number(people) >= remaining}
              onClick={() => adjust(1)}
            >
              +
            </Button>
          </div>
          <p>
            {remaining} {remaining === 1 ? "place" : "places"} remaining
          </p>
          {uncertain && (
            <p role="status">
              We could not confirm the result. Keep this screen open and retry this same admission
              before letting anyone else in.
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending}>
            {pending
              ? "Confirming admission…"
              : uncertain
                ? "Retry this admission"
                : `Admit ${people} ${Number(people) === 1 ? "guest" : "guests"}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
