"use client";
import { useState, useTransition } from "react";
import { ThemePreview } from "./theme-preview";
import { useRouter } from "next/navigation";
import { Button, Input, Select } from "@/modules/shared/components/ui";
import { listThemes, type ActiveThemes, type ColorScheme, type Theme } from "@/modules/theming";
import { COLOR_TOKENS, type FontKey } from "@/modules/theming/lib/schema";
import { copyThemeDraft, themeDraftProblem } from "../lib/theme-editor";
import { activateThemeDraftAction, saveThemeDraftAction } from "../server/theme-actions";

export function ThemeEditor({ active, drafts }: { active: ActiveThemes; drafts: Theme[] }) {
  const initial = (scheme: ColorScheme) =>
    drafts.find((draft) => draft.id === `wedding-${scheme}` && draft.colorScheme === scheme);
  const [pair, setPair] = useState<ActiveThemes>(() => ({
    light: initial("light") ?? copyThemeDraft(active.light, "wedding-light"),
    dark: initial("dark") ?? copyThemeDraft(active.dark, "wedding-dark"),
  }));
  const [saved, setSaved] = useState(() => ({
    light: Boolean(initial("light")),
    dark: Boolean(initial("dark")),
  }));
  const [scheme, setScheme] = useState<ColorScheme>("light");
  const [previewPage, setPreviewPage] = useState<"invitation" | "order">("invitation");
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const draft = pair[scheme];
  const problem = themeDraftProblem(draft);
  const validPair = !themeDraftProblem(pair.light) && !themeDraftProblem(pair.dark);
  function edit(next: Theme) {
    setPair((previous) => ({ ...previous, [scheme]: next }));
    setSaved((previous) => ({ ...previous, [scheme]: false }));
    setMessage("");
  }
  function save() {
    setMessage("Saving draft…");
    setFailure(false);
    startTransition(async () => {
      try {
        const result = await saveThemeDraftAction(draft);
        if (result.status === "saved") {
          setSaved((previous) => ({ ...previous, [scheme]: true }));
          setMessage("Draft saved. Guests still see the published theme.");
        } else {
          setFailure(true);
          setMessage(result.message);
        }
      } catch {
        setFailure(true);
        setMessage("We couldn’t save just now. Please try again.");
      }
    });
  }
  function activate() {
    if (!saved.light || !saved.dark || !validPair) return;
    setMessage("Activating themes…");
    setFailure(false);
    startTransition(async () => {
      try {
        const result = await activateThemeDraftAction({
          light: pair.light.id,
          dark: pair.dark.id,
          reviewed: pair,
        });
        setFailure(result.status !== "activated");
        setMessage(
          result.status === "activated"
            ? "Your themes are live. Guests will see them on their next page."
            : result.message,
        );
        if (result.status === "activated") router.refresh();
      } catch {
        setFailure(true);
        setMessage("We couldn’t activate just now. Please try again.");
      }
    });
  }
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12 text-lg leading-relaxed motion-reduce:[&_*]:transition-none! [&_input]:text-lg [&_label]:text-lg [&_select]:text-lg">
      <p className="type-label text-primary">Your celebration</p>
      <h1 className="mt-3 font-display text-4xl leading-tight md:text-5xl">Theme studio</h1>
      <p className="mt-6 max-w-prose">
        Make it feel like you. Try colours and fonts, save each appearance, then publish both
        together.
      </p>
      <p className="mt-3 text-muted-foreground">
        Live now: {active.light.name} · {active.dark.name}
      </p>
      <div className="mt-12 grid min-w-0 gap-12 xl:grid-cols-2">
        <section aria-label="Theme controls" className="min-w-0 space-y-8">
          <fieldset disabled={pending} className="space-y-6">
            <legend className="font-display text-3xl">Edit a draft</legend>
            <Select
              label="Appearance"
              value={scheme}
              onChange={(event) => {
                setScheme(event.target.value === "dark" ? "dark" : "light");
                setMessage("");
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
            <Select
              label="Start from a preset"
              value=""
              onChange={(event) => {
                const preset = listThemes().find((theme) => theme.id === event.target.value);
                if (preset) edit(copyThemeDraft(preset, draft.id));
              }}
            >
              <option value="" disabled>
                Choose a preset
              </option>
              {listThemes()
                .filter((theme) => theme.colorScheme === scheme)
                .map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
            </Select>
            <Input
              label="Theme name"
              value={draft.name}
              maxLength={100}
              onChange={(event) => edit({ ...draft, name: event.target.value })}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <Select
                label="Heading font"
                value={draft.fonts.display}
                onChange={(event) =>
                  edit({
                    ...draft,
                    fonts: { ...draft.fonts, display: event.target.value as FontKey },
                  })
                }
              >
                <option value="cormorant">Cormorant Garamond</option>
                <option value="playfair">Playfair Display</option>
              </Select>
              <Select
                label="Body font"
                value={draft.fonts.body}
                onChange={(event) =>
                  edit({ ...draft, fonts: { ...draft.fonts, body: event.target.value as FontKey } })
                }
              >
                <option value="inter">Inter</option>
                <option value="jost">Jost</option>
              </Select>
            </div>
            <details>
              <summary className="flex min-h-11 cursor-pointer items-center text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring">
                Colours
              </summary>
              <p className="mt-4 text-muted-foreground">
                Every text and background pair must remain readable. Status colours keep their usual
                meaning.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {COLOR_TOKENS.map((token) => (
                  <div key={token} className="space-y-3">
                    <Input
                      label={token}
                      type="color"
                      value={draft.colors[token]}
                      onChange={(event) =>
                        edit({ ...draft, colors: { ...draft.colors, [token]: event.target.value } })
                      }
                    />
                    <Input
                      label={`${token} hex`}
                      value={draft.colors[token]}
                      maxLength={7}
                      spellCheck={false}
                      onChange={(event) =>
                        edit({ ...draft, colors: { ...draft.colors, [token]: event.target.value } })
                      }
                    />
                  </div>
                ))}
              </div>
            </details>
            <Button variant="secondary" className="text-lg" onClick={save}>
              Save draft
            </Button>
          </fieldset>
          {problem && (
            <div
              role="alert"
              className="border-l-2 border-danger pl-4 break-words whitespace-pre-wrap"
            >
              <h2 className="font-display text-2xl">Please check these colours</h2>
              <p>{problem}</p>
            </div>
          )}
          <section
            className="space-y-6 border-t border-border pt-8"
            aria-labelledby="publish-heading"
          >
            <h2 id="publish-heading" className="font-display text-3xl">
              Ready for your guests?
            </h2>
            <p>
              Light: {saved.light ? "saved" : "unsaved"} · Dark: {saved.dark ? "saved" : "unsaved"}
            </p>
            <p className="text-muted-foreground">
              Save both drafts before activating. This changes the guest site straight away.
            </p>
            <Button
              className="text-lg"
              disabled={pending || !saved.light || !saved.dark || !validPair}
              onClick={activate}
            >
              Activate themes
            </Button>
          </section>
          <p role={failure ? "alert" : "status"} className="break-words whitespace-pre-wrap">
            {message}
          </p>
        </section>
        <section className="min-w-0 space-y-6" aria-labelledby="preview-heading">
          <h2 id="preview-heading" className="font-display text-3xl">
            Live preview
          </h2>
          <p className="text-muted-foreground">
            Sample details only. Your edits stay private until activation.
          </p>
          <Select
            label="Preview page"
            value={previewPage}
            onChange={(event) =>
              setPreviewPage(event.target.value === "order" ? "order" : "invitation")
            }
          >
            <option value="invitation">Invitation</option>
            <option value="order">Table ordering</option>
          </Select>
          <ThemePreview theme={draft} page={previewPage} />
        </section>
      </div>
    </main>
  );
}
