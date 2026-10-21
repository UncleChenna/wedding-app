import type { ColorToken, Theme } from "./schema";

/** WCAG 2.2 AA thresholds. */
export const AA_TEXT = 4.5;
export const AA_NON_TEXT = 3;

/** Token pairs that must meet AA. [foreground, background, minimum ratio, why] */
export const CONTRAST_PAIRS: ReadonlyArray<readonly [ColorToken, ColorToken, number, string]> = [
  ["foreground", "background", AA_TEXT, "body text on page"],
  ["foreground", "surface", AA_TEXT, "body text on cards"],
  ["foreground", "surface-muted", AA_TEXT, "body text on muted panels"],
  ["muted-foreground", "background", AA_TEXT, "secondary text on page"],
  ["muted-foreground", "surface", AA_TEXT, "secondary text on cards"],
  ["primary", "background", AA_TEXT, "links and ghost buttons on page"],
  ["primary", "surface", AA_TEXT, "links and ghost buttons on cards"],
  ["primary-foreground", "primary", AA_TEXT, "primary button label"],
  ["secondary-foreground", "secondary", AA_TEXT, "secondary button label"],
  ["accent-foreground", "accent", AA_TEXT, "accent label"],
  ["danger", "surface", AA_TEXT, "error messages"],
  ["danger-foreground", "danger", AA_TEXT, "danger button label"],
  ["success-foreground", "success", AA_TEXT, "success label"],
  ["input", "surface", AA_NON_TEXT, "input borders (non-text)"],
  ["ring", "background", AA_NON_TEXT, "focus ring on page (non-text)"],
  ["ring", "surface", AA_NON_TEXT, "focus ring on cards (non-text)"],
];

export function hexToRgb(hex: string): [number, number, number] {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match?.[1]) throw new Error(`Invalid hex colour: ${hex}`);
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Relative luminance per WCAG 2.x. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastFailure {
  foreground: ColorToken;
  background: ColorToken;
  ratio: number;
  required: number;
  usage: string;
}

export function checkThemeContrast(theme: Pick<Theme, "colors">): ContrastFailure[] {
  return CONTRAST_PAIRS.flatMap(([foreground, background, required, usage]) => {
    const ratio = contrastRatio(theme.colors[foreground], theme.colors[background]);
    // Compare at 2 d.p. like most contrast checkers, so 4.499 does not pass as 4.5.
    return Math.floor(ratio * 100) / 100 >= required
      ? []
      : [{ foreground, background, ratio, required, usage }];
  });
}

export function formatContrastFailures(themeId: string, failures: ContrastFailure[]): string {
  const lines = failures.map(
    (f) =>
      `  - ${f.foreground} on ${f.background}: ${f.ratio.toFixed(2)}:1 (needs ${f.required}:1, ${f.usage})`,
  );
  return `Theme "${themeId}" fails WCAG AA contrast:\n${lines.join("\n")}`;
}
