"use client";
import { useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";
import { exportRecoveryEvidence, applyRecoveryReceipt } from "../browser/recovery-client";
export function RecoveryExport() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save() {
    setBusy(true);
    try {
      const { evidence, remaining } = await exportRecoveryEvidence();
      const href = URL.createObjectURL(
        new Blob([JSON.stringify(evidence)], { type: "application/json" }),
      );
      const link = document.createElement("a");
      link.href = href;
      link.download = "gate-recovery.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      setMessage(
        `Saved ${evidence.records.length} records for review. The originals remain on this device.${remaining ? ` ${remaining} more remain; repeat after this batch is confirmed.` : ""}`,
      );
    } catch {
      setMessage(
        "No recovery file could be saved. Keep this browser's data and ask the gate lead for help.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function receipt(file: File | undefined) {
    if (!file) return;
    if (file.size > 256 * 1024) {
      setMessage("Choose the receipt file supplied by your administrator.");
      return;
    }
    setBusy(true);
    try {
      const count = await applyRecoveryReceipt((await file.text()).trim());
      setMessage(
        `${count} confirmed records cleared from this device. Unconfirmed records stay here.`,
      );
    } catch {
      setMessage(
        "This receipt could not be confirmed. Keep this browser's data and ask the administrator to retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6 text-lg leading-relaxed">
      <p>
        This does not sign you in or admit anyone. Export the records, then give the file to your
        administrator through your agreed private channel.
      </p>
      <Button disabled={busy} onClick={() => void save()}>
        Save recovery file
      </Button>
      <div className="space-y-2">
        <label htmlFor="recovery-receipt" className="block font-semibold">
          Administrator’s receipt
        </label>
        <p>
          Return to this same browser with the receipt. An internet connection is needed to verify
          it before confirmed records are cleared.
        </p>
        <input
          id="recovery-receipt"
          type="file"
          accept=".txt,text/plain"
          disabled={busy}
          className="min-h-11 w-full max-w-full"
          onChange={(event) => {
            void receipt(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      <p role="status" aria-live="polite">
        {message}
      </p>
      <p>
        Do not clear site data or remove this browser profile while records remain. A deleted copy
        cannot be recovered here.
      </p>
    </div>
  );
}
