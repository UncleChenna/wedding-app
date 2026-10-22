import { hexToRgb } from "./contrast";
import type { ColorToken, Theme } from "./schema";

/**
 * Semantic statuses with a fixed meaning in every theme (PRD THM-4, design
 * principles §9): success = valid/done, warning = already used/waiting,
 * danger = invalid/problem. Themes may tune lightness for contrast, but the hue
 * family must stay recognisable, so a theme can never make "valid" look red.
 */
export const STATUS_KINDS = ["success", "warning", "danger"] as const;
export type StatusKind = (typeof STATUS_KINDS)[number];

export const STATUS_TOKENS = STATUS_KINDS.flatMap((kind) => [
  kind,
  `${kind}-foreground`,
  `${kind}-subtle`,
  `${kind}-subtle-foreground`,
]) as ColorToken[];

/** Allowed HSL hue ranges in degrees, [from, to], inclusive. Red wraps around 0°. */
export const STATUS_HUE_RANGES: Record<StatusKind, readonly [number, number]> = {
  success: [90, 170],
  warning: [25, 60],
  danger: [345, 15],
};

export const STATUS_HUE_NAMES: Record<StatusKind, string> = {
  success: "green",
  warning: "amber",
  danger: "red",
};

/** Below this HSL saturation a colour reads as grey and its hue carries no meaning. */
export const MIN_STATUS_SATURATION = 0.3;

/** The tokens whose colour carries the meaning: the solid fill and text on the tinted panel. */
const HUE_CHECKED = (kind: StatusKind): ColorToken[] => [
  kind,
  `${kind}-subtle-foreground` as ColorToken,
];

function hsl(hex: string): { hue: number; saturation: number } {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation };
}

/** HSL hue of a 6-digit hex colour, 0–360. */
export function hueOf(hex: string): number {
  return hsl(hex).hue;
}

export function inHueRange(hue: number, [from, to]: readonly [number, number]): boolean {
  return from <= to ? hue >= from && hue <= to : hue >= from || hue <= to;
}

export interface StatusHueFailure {
  token: ColorToken;
  kind: StatusKind;
  hue: number;
  saturation: number;
}

export function checkStatusHues(theme: Pick<Theme, "colors">): StatusHueFailure[] {
  return STATUS_KINDS.flatMap((kind) =>
    HUE_CHECKED(kind).flatMap((token) => {
      const { hue, saturation } = hsl(theme.colors[token]);
      return inHueRange(hue, STATUS_HUE_RANGES[kind]) && saturation >= MIN_STATUS_SATURATION
        ? []
        : [{ token, kind, hue, saturation }];
    }),
  );
}

export function formatStatusHueFailures(themeId: string, failures: StatusHueFailure[]): string {
  const lines = failures.map((f) => {
    const [from, to] = STATUS_HUE_RANGES[f.kind];
    return `  - ${f.token}: hue ${f.hue.toFixed(0)}°, saturation ${(f.saturation * 100).toFixed(0)}% (must read as ${STATUS_HUE_NAMES[f.kind]}: hue ${from}–${to}°, saturation ≥ ${MIN_STATUS_SATURATION * 100}%)`;
  });
  return `Theme "${themeId}" changes the meaning of a status colour:\n${lines.join("\n")}`;
}
