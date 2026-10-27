"use client";

import { useEffect, useRef, useState } from "react";

import { buildShareLinks, type ShareInput } from "@/modules/invitations/lib/share";
import { Button, Input, Sheet, useToast } from "@/modules/shared/components/ui";

const linkStyle =
  "flex min-h-13 min-w-11 items-center rounded-md px-5 py-3 text-lg font-medium text-primary hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Caller supplies an authorized invitation and approved message; never writes sent status. */
export function ShareMenu({ invitation }: { invitation: ShareInput }) {
  const [open, setOpen] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);
  const [manualCopy, setManualCopy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const manualField = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const result = buildShareLinks(invitation);

  useEffect(() => {
    if (manualCopy) {
      const field = manualField.current?.querySelector("input");
      field?.focus();
      field?.select();
    }
  }, [manualCopy]);

  function begin() {
    setError("");
    setManualCopy(false);
    let supported = false;
    if (result.ok && typeof navigator.share === "function") {
      try {
        supported =
          typeof navigator.canShare !== "function" ||
          navigator.canShare({
            title: result.links.subject,
            text: invitation.message,
            url: result.links.url,
          });
      } catch {
        supported = false;
      }
    }
    setNativeAvailable(supported);
    setOpen(true);
  }

  async function copy() {
    if (!result.ok || busy) return;
    setBusy(true);
    setError("");
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.links.url);
        copied = true;
      }
    } catch {
      // Older browsers or denied permissions still get a local selection fallback.
    }
    if (!copied && content.current) {
      const previous = document.activeElement;
      const field = document.createElement("textarea");
      field.value = result.links.url;
      field.readOnly = true;
      field.className = "sr-only";
      field.tabIndex = -1;
      content.current.append(field); // Must be inside the modal, not its inert backdrop.
      field.select();
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        field.remove();
        if (previous instanceof HTMLElement) previous.focus();
      }
    }
    setBusy(false);
    if (copied) {
      setOpen(false);
      setManualCopy(false);
      toast({
        title: "Link copied",
        description: "Paste it into a message when you're ready.",
        tone: "success",
      });
    } else {
      setManualCopy(true);
    }
  }

  async function shareNative() {
    if (!result.ok || busy) return;
    setBusy(true);
    setError("");
    try {
      // Keep this call directly in the click handler to preserve user activation.
      await navigator.share({
        title: result.links.subject,
        text: invitation.message,
        url: result.links.url,
      });
      setOpen(false);
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) {
        setError("Choose another way to share, or copy the link.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="lg" onClick={begin} aria-haspopup="dialog">
        Share invitation
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Share invitation"
        className="max-h-[90dvh] overflow-y-auto [&_header_h2]:text-3xl"
      >
        <div ref={content} className="space-y-6">
          <p className="text-lg leading-relaxed">Choose how to send this invitation.</p>
          {!result.ok ? (
            <p role="alert" className="text-lg leading-relaxed">
              {result.message}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <a
                  href={result.links.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkStyle}
                >
                  WhatsApp
                </a>
                <a href={result.links.email} className={linkStyle}>
                  Email
                </a>
                {nativeAvailable && (
                  <Button
                    size="lg"
                    variant="ghost"
                    fullWidth
                    disabled={busy}
                    onClick={shareNative}
                    className="justify-start"
                  >
                    More ways to share
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  fullWidth
                  disabled={busy}
                  aria-busy={busy}
                  onClick={copy}
                  className="justify-start"
                >
                  {busy ? "One moment…" : "Copy link"}
                </Button>
              </div>
              {error && (
                <p role="alert" className="text-lg leading-relaxed">
                  {error}
                </p>
              )}
              {manualCopy && (
                <div ref={manualField} className="space-y-3">
                  <p className="text-lg leading-relaxed">
                    Copy the selected link, then paste it into your message.
                  </p>
                  <Input
                    label="Invitation link"
                    value={result.links.url}
                    readOnly
                    onFocus={(event) => event.target.select()}
                    className="text-lg"
                  />
                </div>
              )}
              <p className="text-lg leading-relaxed text-muted-foreground">
                You&apos;ll review your message in the app you choose.
              </p>
            </>
          )}
        </div>
      </Sheet>
    </>
  );
}
