"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button, Input } from "@/modules/shared/components/ui";
import {
  GUEST_CSV_MAX_BYTES,
  readGuestCsv,
  type ImportCommitViewResult,
  type ImportPreviewViewResult,
} from "../lib/guest-import-view";

type Approved = Extract<ImportPreviewViewResult, { status: "preview" }>;
type Failure = Extract<ImportPreviewViewResult, { status: "error" }>;
const template =
  "name,phone,email,party size,side,table,household\r\nAda Example,,,2,Family,,Example household\r\n";

export function GuestImportForm({
  previewAction,
  commitAction,
  readFile = readGuestCsv,
}: {
  previewAction: (csv: string) => Promise<ImportPreviewViewResult>;
  commitAction: (input: { previewId: string; digest: string }) => Promise<ImportCommitViewResult>;
  readFile?: (file: File) => Promise<string>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Approved | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [complete, setComplete] = useState<Extract<
    ImportCommitViewResult,
    { status: "committed" }
  > | null>(null);
  const [committing, setCommitting] = useState(false);
  const [pending, start] = useTransition();
  const version = useRef(0);
  const alert = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const success = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (failure) alert.current?.focus();
    else if (complete) success.current?.focus();
    else if (preview) heading.current?.focus();
  }, [failure, complete, preview]);
  useEffect(() => {
    if (!preview || committing) return;
    const expire = () => {
      setPreview(null);
      setFailure({
        status: "error",
        message: "This preview has expired. Preview your file again before importing.",
        errors: [],
      });
    };
    const remaining = Date.parse(preview.expiresAt) - Date.now();
    const timer = setTimeout(
      expire,
      Number.isFinite(remaining) ? Math.max(0, Math.min(remaining, 2147483647)) : 0,
    );
    return () => clearTimeout(timer);
  }, [preview, committing]);
  const fail = (message: string) => setFailure({ status: "error", message, errors: [] });
  function submitPreview() {
    if (!file || pending) return;
    const current = version.current;
    setPreview(null);
    setFailure(null);
    setComplete(null);
    if (file.size > GUEST_CSV_MAX_BYTES) {
      fail("Choose a CSV file smaller than 256 KB, with no more than 300 guests.");
      return;
    }
    start(async () => {
      let csv: string;
      try {
        csv = await readFile(file);
      } catch {
        if (current === version.current)
          fail("We couldn't read this file. Save it as a UTF-8 CSV and try again.");
        return;
      }
      if (current !== version.current) return;
      try {
        const result = await previewAction(csv);
        if (current !== version.current) return;
        if (result.status === "error") setFailure(result);
        else setPreview(result);
      } catch {
        if (current === version.current)
          fail("The preview couldn't load. Please try again shortly.");
      }
    });
  }
  function commit() {
    if (!preview || pending) return;
    setCommitting(true);
    setFailure(null);
    start(async () => {
      try {
        const result = await commitAction({ previewId: preview.id, digest: preview.digest });
        setPreview(null);
        if (result.status === "committed") {
          setFailure(null);
          setComplete(result);
        } else fail(result.message);
      } catch {
        setPreview(null);
        fail("We couldn't confirm the import. Preview this same file again to check it safely.");
      } finally {
        setCommitting(false);
      }
    });
  }
  return (
    <div className="mt-12 space-y-12 [&_button]:text-lg [&_input]:text-lg [&_label]:text-lg">
      <section className="space-y-6" aria-labelledby="import-file-heading">
        <h2 id="import-file-heading" className="font-display text-3xl">
          Choose your guest list
        </h2>
        <p className="max-w-prose">
          Use a UTF-8 CSV with up to 300 guest rows and a file size of 256 KB or less. Required
          columns: name, phone, email, party size, side and table. Phone, email, side and table
          cells may be blank.
        </p>
        <p className="max-w-prose">
          Party size is the maximum number invited, including named guests. Use the optional
          household column to keep people on one invitation. Shared contact details across separate
          households need correcting before import.
        </p>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`}
          download="guest-import-template.csv"
          className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >
          Download CSV template
        </a>
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            submitPreview();
          }}
        >
          <Input
            type="file"
            label="Guest CSV file"
            accept=".csv,text/csv"
            disabled={committing}
            onChange={(event) => {
              version.current++;
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setFailure(null);
              setComplete(null);
            }}
          />
          <Button type="submit" disabled={!file || pending} loading={pending && !committing}>
            Preview guests
          </Button>
        </form>
      </section>
      {failure && (
        <div ref={alert} role="alert" tabIndex={-1} className="space-y-4">
          <h2 className="font-display text-3xl">Check your file</h2>
          <p>{failure.message}</p>
          {failure.errors.length > 0 && (
            <ul className="list-disc space-y-3 pl-6">
              {failure.errors.map((error, index) => (
                <li key={`${error.row}-${error.column}-${index}`}>
                  Row {error.row} · {error.column}: {error.message}
                </li>
              ))}
            </ul>
          )}
          <p>No new import has been confirmed here. Correct the file or preview it again.</p>
        </div>
      )}
      {preview && (
        <section aria-labelledby="import-preview-heading" className="space-y-6">
          <h2
            id="import-preview-heading"
            ref={heading}
            tabIndex={-1}
            className="font-display text-3xl"
          >
            Review your invitations
          </h2>
          <p>
            {preview.guestCount} named guests across {preview.invitationCount} invitations. Nothing
            is added until you choose Import guests.
          </p>
          <p className="max-w-prose text-muted-foreground">
            New invitations are drafts. Existing replies are never overwritten. Repeating an already
            completed import does not add duplicates. This preview expires after 30 minutes.
          </p>
          <ul className="divide-y divide-border">
            {preview.households.map((household) => (
              <li key={household.key} className="space-y-3 py-6 wrap-anywhere">
                <h3 className="font-display text-2xl">{household.heading}</h3>
                <p>{household.members.join(" · ")}</p>
                <p>
                  Up to {household.partyLimit} guests · {household.side || "Side not set"} ·{" "}
                  {household.table || "Table not assigned"}
                </p>
              </li>
            ))}
          </ul>
          <Button loading={committing} disabled={pending} onClick={commit}>
            Import guests
          </Button>
        </section>
      )}
      {complete && (
        <div ref={success} role="status" tabIndex={-1} className="space-y-6">
          <h2 className="font-display text-3xl">Guest list ready</h2>
          <p>
            {complete.replayed
              ? "This import was already completed. No duplicate invitations were added."
              : `${complete.count} draft invitation${complete.count === 1 ? "" : "s"} added.`}
          </p>
          <Link
            href="/admin/guests"
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
          >
            Back to guests
          </Link>
        </div>
      )}
    </div>
  );
}
