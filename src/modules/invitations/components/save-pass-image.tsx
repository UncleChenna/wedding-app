"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/modules/shared/components/ui/button";

export function SavePassImage({ href }: { href: string }) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState(
    "If saving doesn't work here, open the image and hold it to save.",
  );
  const [scheme, setScheme] = useState("light");
  const objectUrls = useRef<string[]>([]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => setScheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  const imageHref = href + "?scheme=" + scheme;
  async function save() {
    setBusy(true);
    setFile(null);
    setMessage("Preparing your image…");
    try {
      const response = await fetch(imageHref, { cache: "no-store", credentials: "same-origin" });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png"))
        throw new Error("Unavailable");
      const nextFile = new File([await response.blob()], "entry-pass.png", { type: "image/png" });
      const url = URL.createObjectURL(nextFile);
      objectUrls.current.forEach((old) => URL.revokeObjectURL(old));
      objectUrls.current = [url];
      const link = document.createElement("a");
      link.href = url;
      link.download = "entry-pass.png";
      document.body.append(link);
      link.click();
      link.remove();
      setFile(nextFile);
      setMessage(
        "Your image is ready. If it hasn't saved, choose Open image, then hold it to save.",
      );
    } catch {
      setMessage(
        "We couldn't prepare your image. Please try again, or keep a screenshot of your pass.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    if (!file || !navigator.share) return;
    try {
      await navigator.share({ files: [file], title: "Your entry pass" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Sharing isn't available here. Choose Open image, then hold it to save.");
    }
  }
  let canShare = false;
  try {
    canShare = !!file && !!navigator.canShare?.({ files: [file] });
  } catch {
    /* The open-image fallback remains available. */
  }
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-4">
        <Button onClick={() => void save()} disabled={busy} aria-busy={busy}>
          Save image
        </Button>
        {canShare && (
          <Button variant="secondary" onClick={() => void share()}>
            Share image
          </Button>
        )}
        <a
          href={imageHref}
          target="_blank"
          rel="noopener noreferrer"
          referrerPolicy="no-referrer"
          className="inline-flex min-h-11 min-w-11 items-center py-2 text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Open image
        </a>
      </div>
      <p role="status" className="mt-6 min-h-32 text-base leading-relaxed">
        {message}
      </p>
    </div>
  );
}
