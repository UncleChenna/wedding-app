"use client";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { z } from "zod";
import { Button, Input, Textarea } from "@/modules/shared/components/ui";
import type {
  InvitationDesignInput,
  InvitationDesignPhoto,
  InvitationDesignState,
} from "@/modules/shared/lib/invitation-design";
import { invitationSiteCopy } from "@/modules/invitations/lib/copy";
import { validateEditorFile } from "../lib/invitation-design";
import { saveInvitationDesignAction } from "../server/invitation-design-actions";

const uploadedPhoto = z.object({
  id: z.uuid(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  blurDataURL: z.string().startsWith("data:image/webp;base64,").max(10947),
});

export function InvitationDesignForm({
  defaults,
  photo: initialPhoto,
}: {
  defaults: InvitationDesignInput;
  photo: InvitationDesignPhoto | null;
}) {
  const [version, setVersion] = useState(defaults.version);
  const [state, action, pending] = useActionState<InvitationDesignState, FormData>(
    async (previous, form) => {
      const result = await saveInvitationDesignAction(previous, form);
      if (result.status === "saved") setVersion(result.version);
      return result;
    },
    { status: "idle" },
  );
  const [headline, setHeadline] = useState(defaults.headline);
  const [subline, setSubline] = useState(defaults.subline);
  const [alt, setAlt] = useState(defaults.photoAlt);
  const [photo, setPhoto] = useState(initialPhoto);
  const [preview, setPreview] = useState<{ id: string; url: string } | null>(null);
  const visiblePreview = preview?.id === photo?.id ? preview?.url : null;
  const [photoMessage, setPhotoMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (!photo) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    void (async () => {
      try {
        const response = await fetch(`/api/admin/photos/${photo.id}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Preview unavailable");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview({ id: photo.id, url: objectUrl });
      } catch {
        if (!controller.signal.aborted)
          setPhotoMessage("The preview couldn’t load. Your saved photo and wording are unchanged.");
      }
    })();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo]);

  async function upload(file: File | undefined) {
    if (!file) return;
    const invalid = validateEditorFile(file);
    if (invalid) {
      setPhotoMessage(invalid);
      return;
    }
    setUploading(true);
    setPhotoMessage("");
    try {
      const response = await fetch("/api/admin/photos", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        const message =
          response.status === 413
            ? "Choose a photo up to 8 MB."
            : response.status === 415 || response.status === 400
              ? "Choose a valid JPEG, PNG or WebP photo."
              : "We couldn’t upload the photo. Your wording and previous photo are still here.";
        setPhotoMessage(message);
        return;
      }
      const parsed = uploadedPhoto.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid upload response");
      setPhoto(parsed.data);
      setPhotoMessage("Photo uploaded. Save the design when you’re ready to publish it.");
    } catch {
      setPhotoMessage(
        "We couldn’t upload the photo. Your wording and previous photo are still here.",
      );
    } finally {
      setUploading(false);
    }
  }
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="mt-10 space-y-10 text-lg [&_label]:text-lg"
    >
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="photoId" value={photo?.id ?? ""} />
      <section className="space-y-6" aria-labelledby="design-wording">
        <h2 id="design-wording" className="font-display text-3xl">
          Your wording
        </h2>
        <Input
          label="Headline"
          name="headline"
          value={headline}
          readOnly={pending}
          onChange={(event) => setHeadline(event.target.value)}
          maxLength={200}
          required
        />
        <Textarea
          label="Invitation message"
          name="subline"
          value={subline}
          readOnly={pending}
          onChange={(event) => setSubline(event.target.value)}
          maxLength={1000}
          rows={4}
          required
        />
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setHeadline(invitationSiteCopy.headline);
            setSubline(invitationSiteCopy.subline);
          }}
        >
          Use approved wording
        </Button>
      </section>
      <section className="space-y-6" aria-labelledby="design-photo">
        <h2 id="design-photo" className="font-display text-3xl">
          Your photograph
        </h2>
        <Input
          label="Upload a photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading || pending}
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
          hint="JPEG, PNG or WebP, up to 8 MB."
        />
        <Input
          label="Photo description"
          name="photoAlt"
          value={alt}
          readOnly={pending}
          onChange={(event) => setAlt(event.target.value)}
          maxLength={500}
          required={Boolean(photo)}
          hint="Describe the people and setting for guests who cannot see the image."
        />
        {photo && (
          <Button
            type="button"
            variant="secondary"
            disabled={uploading || pending}
            onClick={() => {
              setPhoto(null);
              setAlt("");
              setPhotoMessage("");
            }}
          >
            Use sample photograph
          </Button>
        )}
        <p role="status" aria-live="polite">
          {uploading ? "Uploading your photo…" : photoMessage}
        </p>
      </section>
      <section aria-labelledby="design-preview" className="space-y-6 border-t border-border pt-8">
        <h2 id="design-preview" className="font-display text-3xl">
          Invitation preview
        </h2>
        {photo ? (
          visiblePreview ? (
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={visiblePreview}
                alt={alt || "Selected invitation photograph"}
                fill
                sizes="(min-width: 1024px) 768px, 100vw"
                placeholder="blur"
                blurDataURL={photo.blurDataURL}
                className="object-cover object-top"
              />
            </div>
          ) : (
            <p>Loading your selected photograph…</p>
          )
        ) : (
          <p>Sample photograph will be shown. It is not a portrait of the couple.</p>
        )}
        <p className="font-display text-3xl leading-tight wrap-anywhere">{headline}</p>
        <p className="leading-relaxed wrap-anywhere whitespace-pre-line">{subline}</p>
      </section>
      <p className="max-w-prose leading-relaxed">
        Saving publishes this wording and selected photo on your invitations. The saved photo can be
        viewed by anyone with its image link; uploading alone keeps it private. Previously published
        copies may remain available after you replace the photo.
      </p>
      {state.status !== "idle" && (
        <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>
      )}
      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Saving…" : "Save invitation design"}
      </Button>
    </form>
  );
}
