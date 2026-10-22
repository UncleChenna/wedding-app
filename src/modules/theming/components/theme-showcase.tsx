import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  ToastProvider,
  ToastView,
} from "@/modules/shared/components/ui";

import { themeStyle } from "../lib/css-vars";
import { COLOR_TOKENS, type Theme } from "../lib/schema";
import { MotionShowcase } from "./motion-showcase";
import { ShowcaseInteractive } from "./showcase-interactive";

/** Every base component rendered in one theme. Used by /dev/theme. */
export function ThemeShowcase({ theme, active }: { theme: Theme; active: boolean }) {
  return (
    <section
      data-theme={theme.id}
      data-testid={`theme-${theme.id}`}
      aria-labelledby={`${theme.id}-title`}
      style={themeStyle(theme)}
      className="bg-background px-4 py-12 font-sans text-foreground sm:px-8"
    >
      <ToastProvider>
        <div className="mx-auto flex max-w-5xl flex-col gap-10">
          <header className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.3em] text-primary uppercase">
              {theme.colorScheme} theme{active ? " · active" : ""}
            </p>
            <h2 id={`${theme.id}-title`} className="font-display text-4xl font-medium sm:text-5xl">
              {theme.name}
            </h2>
            <p className="text-muted-foreground">
              <code className="rounded-sm bg-surface-muted px-1.5 py-0.5 text-sm">{theme.id}</code>{" "}
              · display font {theme.fonts.display}, body font {theme.fonts.body}
            </p>
          </header>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Colour tokens
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {COLOR_TOKENS.map((token) => (
                <li key={token} className="flex flex-col gap-1.5">
                  <span
                    className="h-12 rounded-md border border-border"
                    style={{ backgroundColor: `var(--t-color-${token})` }}
                  />
                  <span className="truncate text-xs text-muted-foreground">{token}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Buttons
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          <MotionShowcase />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Kindly reply</CardTitle>
                <CardDescription>Card with header, content and footer.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input label="Full name" placeholder="Ada Lovelace" autoComplete="name" />
                <Input
                  label="Dietary requirements"
                  hint="Let the kitchen know about allergies."
                  placeholder="e.g. vegetarian"
                />
                <Input
                  label="Invitation code"
                  defaultValue="ABC"
                  error="That code doesn't match an invitation."
                />
                <Input label="Table" defaultValue="12" disabled />
              </CardContent>
              <CardFooter>
                <Button fullWidth>Send RSVP</Button>
              </CardFooter>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="bg-surface-muted shadow-sm">
                <CardHeader>
                  <CardTitle>Toasts</CardTitle>
                  <CardDescription>Static previews, plus a live trigger.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <ToastView title="RSVP saved" description="We can't wait to see you." />
                  <ToastView tone="success" title="Checked in" description="Table 7 · 2 guests" />
                  <ToastView
                    tone="danger"
                    title="Couldn't send order"
                    description="Check your connection."
                  />
                </CardContent>
              </Card>
              <ShowcaseInteractive />
            </div>
          </div>
        </div>
      </ToastProvider>
    </section>
  );
}
