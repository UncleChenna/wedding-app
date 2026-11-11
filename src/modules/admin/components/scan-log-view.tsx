import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Card, Input, Select } from "@/modules/shared/components/ui";
import {
  scanLogSearch,
  scanResolutionNotes,
  scanVerdictLabels,
  scanVerdicts,
  type ScanLogEntry,
  type ScanLogFilters,
  type ScanLogOptions,
  type ScanVerdict,
} from "../lib/scan-log";

function Timestamp({ value }: { value: string }) {
  return <time dateTime={value}>{value.replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time>;
}
function Verdict({ result }: { result: ScanVerdict }) {
  const style =
    result === "valid"
      ? "bg-success-subtle text-success-subtle-foreground"
      : result === "already_used"
        ? "bg-warning-subtle text-warning-subtle-foreground"
        : "bg-danger-subtle text-danger-subtle-foreground";
  return (
    <span className={`inline-block rounded-sm px-3 py-1 font-medium ${style}`}>
      {scanVerdictLabels[result]}
    </span>
  );
}
const linkStyle =
  "inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function ScanLogView({
  entries,
  filters,
  options,
  hasMore,
  renderNote,
}: {
  entries: readonly ScanLogEntry[];
  filters: ScanLogFilters;
  options: ScanLogOptions;
  hasMore: boolean;
  renderNote(entry: ScanLogEntry): ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-10 px-6 py-12 text-lg leading-relaxed wrap-anywhere">
      <header className="space-y-4">
        <h1 className="font-display text-4xl md:text-5xl">Scan log</h1>
        <p className="max-w-prose">
          Review gate checks and offline conflicts. Original evidence stays unchanged when you add a
          resolution note. All times are UTC.
        </p>
      </header>
      <form
        key={scanLogSearch(filters)}
        method="get"
        action="/admin/scans"
        aria-label="Filter scans"
        className="space-y-6 [&_input]:text-lg [&_label]:text-lg [&_select]:text-lg"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Select label="Invitation" name="invitation" defaultValue={filters.invitation ?? ""}>
            <option value="">All invitations</option>
            <option value="unknown">Unknown invitation</option>
            {options.invitations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Result" name="result" defaultValue={filters.result ?? ""}>
            <option value="">All results</option>
            {scanVerdicts.map((value) => (
              <option key={value} value={value}>
                {scanVerdictLabels[value]}
              </option>
            ))}
          </Select>
          <Input
            label="Received from (UTC)"
            type="datetime-local"
            name="from"
            defaultValue={filters.from?.slice(0, 16) ?? ""}
          />
          <Input
            label="Received until (UTC)"
            type="datetime-local"
            name="to"
            defaultValue={filters.to?.slice(0, 16) ?? ""}
          />
          <Select label="Staff" name="staff" defaultValue={filters.staff ?? ""}>
            <option value="">All staff</option>
            {options.staff.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Device" name="device" defaultValue={filters.device ?? ""}>
            <option value="">All devices</option>
            {options.devices.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select label="Connection" name="source" defaultValue={filters.source ?? ""}>
            <option value="">All connections</option>
            <option value="online">Online</option>
            <option value="offline">Offline sync</option>
            <option value="legacy">Historical import</option>
          </Select>
          <Select
            label="Conflicts"
            name="conflict"
            defaultValue={filters.conflict === undefined ? "" : filters.conflict ? "yes" : "no"}
          >
            <option value="">All scans</option>
            <option value="yes">Conflicts only</option>
            <option value="no">Without conflicts</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Button type="submit" size="lg">
            Apply filters
          </Button>
          <Link href="/admin/scans" className={linkStyle}>
            Clear filters
          </Link>
        </div>
      </form>
      <section aria-label="Scan attempts" className="space-y-8">
        <h2 className="font-display text-3xl">Scan attempts</h2>
        {!entries.length && <p>No scans match these filters.</p>}
        {entries.map((entry) => (
          <Card key={entry.id} className="p-6 shadow-none">
            <article aria-labelledby={`scan-${entry.id}`} className="space-y-6">
              <div className="space-y-3">
                <h3 id={`scan-${entry.id}`} className="font-display text-3xl">
                  {entry.invitationName ||
                    (entry.invitationId ? "Invitation" : "Unknown invitation")}
                </h3>
                <Verdict result={entry.result} />
                {entry.conflict && (
                  <p className="font-medium text-danger-subtle-foreground">Conflict recorded</p>
                )}
              </div>
              <dl className="grid gap-6 lg:grid-cols-2">
                <div>
                  <dt className="font-medium">Reported by device</dt>
                  <dd>
                    <Timestamp value={entry.reportedAt} />
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Received by server</dt>
                  <dd>
                    <Timestamp value={entry.receivedAt} />
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Device reported</dt>
                  <dd>{scanVerdictLabels[entry.reportedResult]}</dd>
                </div>
                <div>
                  <dt className="font-medium">People</dt>
                  <dd>
                    {entry.reportedPeople} reported · {entry.admittedPeople} admitted
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Staff</dt>
                  <dd>{entry.staffName || "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Device</dt>
                  <dd>{entry.deviceName || entry.deviceId || "Not recorded"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Connection</dt>
                  <dd>
                    {entry.source === "offline"
                      ? "Offline sync"
                      : entry.source === "online"
                        ? "Online"
                        : "Historical import"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Input method</dt>
                  <dd>
                    {entry.inputMethod === "manual"
                      ? "Manual entry"
                      : entry.inputMethod === "qr"
                        ? "QR scan"
                        : "Not recorded"}
                  </dd>
                </div>
              </dl>
              <section
                aria-label="Resolution notes"
                className="space-y-4 border-t border-border pt-6"
              >
                <h4 className="font-display text-2xl">Resolution notes</h4>
                <p className="text-muted-foreground">
                  Latest 20 notes, newest first. Earlier notes remain in the audit record.
                </p>
                {entry.notes.length ? (
                  <ol className="space-y-4">
                    {entry.notes.map((note) => (
                      <li key={note.id}>
                        <p>{scanResolutionNotes[note.resolution]}</p>
                        <p className="text-muted-foreground">
                          Admin · <Timestamp value={note.recordedAt} />
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No resolution notes yet.</p>
                )}
                {renderNote(entry)}
              </section>
            </article>
          </Card>
        ))}
      </section>
      <nav aria-label="Scan pages" className="flex flex-wrap items-center gap-6">
        {filters.page > 1 && (
          <Link
            className={linkStyle}
            href={`/admin/scans?${scanLogSearch({ ...filters, page: filters.page - 1 })}`}
          >
            Newer scans
          </Link>
        )}
        <p>Page {filters.page}</p>
        {hasMore && (
          <Link
            className={linkStyle}
            href={`/admin/scans?${scanLogSearch({ ...filters, page: filters.page + 1 })}`}
          >
            Older scans
          </Link>
        )}
      </nav>
    </main>
  );
}
