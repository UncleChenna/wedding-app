import { InstallPrompt } from "@/modules/shared/components/install-prompt";
import { IosInstallGuide } from "@/modules/shared/components/ios-install-guide";
import {
  ActionBar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Input,
  Monogram,
  Paper,
  QuantityStepper,
  RadioGroup,
  Select,
  Textarea,
  ToastProvider,
  ToastView,
  StatusBadge,
  StatusPanel,
} from "@/modules/shared/components/ui";
import { QrCode } from "@/modules/shared/components/ui/qr-code";

import { themeStyle } from "../lib/css-vars";
import { COLOR_TOKENS, type Theme } from "../lib/schema";
import { STATUS_HUE_NAMES, type StatusKind } from "../lib/status";
import { TYPE_STYLES } from "../lib/typography";
import { MotionShowcase } from "./motion-showcase";
import { ShowcaseInteractive } from "./showcase-interactive";

/** Realistic length for a signed gate pass URL; TICKET-056 defines the real format. */
const SAMPLE_PASS =
  "https://wedding.example/p/eyJ2IjoxLCJpbnYiOiJpbnZfOGs0bTJ4IiwicCI6Mn0.MEUCIQD3pQx7Zr9nW1vYH5kTq2LsA8cJdF0eRgUoBiNtPmXwVhIgK4sZ";

/** Fixed status meanings (THM-4). Class names are literal so Tailwind can see them. */
const STATUS_EXAMPLES: ReadonlyArray<{
  kind: StatusKind;
  label: string;
  detail: string;
  panel: string;
  badge: string;
}> = [
  {
    kind: "success",
    label: "Valid",
    detail: "Welcome, Ada. Table 7 is ready for you.",
    panel: "bg-success-subtle text-success-subtle-foreground",
    badge: "bg-success text-success-foreground",
  },
  {
    kind: "warning",
    label: "Already used",
    detail: "Admitted at 19:42 by Gate 1.",
    panel: "bg-warning-subtle text-warning-subtle-foreground",
    badge: "bg-warning text-warning-foreground",
  },
  {
    kind: "danger",
    label: "Invalid",
    detail: "Not on the guest list. Refer to the couple's contact.",
    panel: "bg-danger-subtle text-danger-subtle-foreground",
    badge: "bg-danger text-danger-foreground",
  },
];

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
              Status
            </h3>
            <ul className="grid gap-3 sm:grid-cols-3" data-testid="status-swatches">
              {STATUS_EXAMPLES.map(({ kind, label, detail, panel, badge }) => (
                <li
                  key={kind}
                  data-status={kind}
                  data-hue={STATUS_HUE_NAMES[kind]}
                  className={`flex flex-col gap-2 rounded-md p-4 ${panel}`}
                >
                  <span
                    className={`self-start rounded-sm px-2 py-0.5 text-xs font-semibold tracking-wider uppercase ${badge}`}
                  >
                    {label}
                  </span>
                  <span className="text-base">{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4" data-testid="typography">
            <h3 className="type-label text-muted-foreground">Typography</h3>
            <dl className="flex flex-col gap-5">
              {TYPE_STYLES.map((style) => (
                <div key={style.className} className="flex flex-col gap-1">
                  <dt className="text-sm text-muted-foreground">
                    <code>{style.className}</code> · {style.use}
                  </dt>
                  <dd
                    data-type-style={style.className}
                    className={`${style.className} max-w-[65ch]`}
                  >
                    {style.sample}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col gap-3" data-testid="staff-status">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Staff status panels
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <StatusPanel status="valid" identifier="Ada Lovelace" detail="Party of 2 · Table 7" />
              <StatusPanel
                status="used"
                identifier="Ada Lovelace"
                detail="Admitted 19:42 by Gate 1 · 2 of 2"
              />
              <StatusPanel
                status="not-rsvpd"
                identifier="Grace Hopper"
                detail="No RSVP yet. Check with the couple's contact."
              />
              <StatusPanel
                status="invalid"
                identifier="Unknown code"
                detail="Not on the guest list."
              />
              <StatusPanel
                status="revoked"
                identifier="Old invitation"
                detail="This pass was replaced. Ask for the new one."
              />
              <StatusPanel
                status="valid"
                identifier="Oluwaseunfunmilayo Chukwuemeka-Fitzwilliam"
                detail="Party of 4 · Table 12 · Long names wrap instead of overflowing."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge tone="success">Served</StatusBadge>
              <StatusBadge tone="warning">Preparing</StatusBadge>
              <StatusBadge tone="danger" icon="ban">
                Cancelled
              </StatusBadge>
            </div>
          </div>

          <div className="flex flex-col gap-4" data-testid="decorations">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Decoration
            </h3>
            <Paper className="bg-card text-card-foreground flex flex-col items-center gap-6 rounded-lg border border-border px-6 py-10 text-center">
              <Monogram initials={["A", "G"]} />
              <p className="max-w-prose text-base leading-relaxed">
                Together with their families, Ada and Grace invite you to celebrate their wedding.
              </p>
              <Divider className="max-w-xs" />
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                The celebration
              </p>
            </Paper>
            <Divider variant="staff" />
            <p className="self-start rounded-sm bg-decorative px-3 py-1 text-xs font-semibold tracking-widest text-decorative-foreground uppercase">
              Table 12
            </p>
          </div>

          <div className="flex flex-col gap-3" data-testid="qr-code">
            <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              QR pass
            </h3>
            <div className="w-48 rounded-md border border-border">
              <QrCode value={SAMPLE_PASS} label="Sample gate pass QR code" />
            </div>
            <p className="text-sm text-muted-foreground">
              Always dark on light, with a four-module quiet zone.
            </p>
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
            {/* Shown in place; on a phone a real step keeps it pinned to the bottom of the screen. */}
            <ActionBar sticky={false} status="2 menu items selected." data-testid="action-bar">
              <Button>Review order</Button>
              <Button variant="ghost">Change table</Button>
            </ActionBar>
          </div>

          <InstallPrompt />
          <IosInstallGuide />
          <MotionShowcase />

          <Card data-testid="form-controls">
            <CardHeader>
              <CardTitle>Who&apos;s walking in with you?</CardTitle>
              <CardDescription>
                Radios, select, checkbox, textarea and quantity stepper.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <RadioGroup
                name={`rsvp-${theme.id}`}
                legend="Will you join us?"
                defaultValue="yes"
                options={[
                  { value: "yes", label: "Count me in" },
                  { value: "no", label: "I'll be there in spirit" },
                ]}
              />
              <Select label="Meal" hint="Choose one per guest." defaultValue="">
                <option value="" disabled>
                  Choose a meal…
                </option>
                <option value="jollof">Jollof rice &amp; grilled chicken</option>
                <option value="plantain">Plantain &amp; bean stew (vegan)</option>
              </Select>
              <Checkbox label="I'm vegetarian" hint="We'll let the kitchen know." />
              <Checkbox label="I agree to the privacy notice" error="Please tick to continue." />
              <Textarea
                label="Dietary notes"
                hint="Allergies or anything the kitchen should know."
                placeholder="e.g. no peanuts"
              />
              <div className="flex flex-col gap-6">
                <QuantityStepper
                  label="Jollof rice"
                  min={0}
                  max={5}
                  defaultValue={1}
                  hint="Up to 5 per order."
                />
                <QuantityStepper
                  label="Water"
                  min={0}
                  max={5}
                  defaultValue={5}
                  error="That's the limit for one order."
                />
              </div>
            </CardContent>
          </Card>

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
