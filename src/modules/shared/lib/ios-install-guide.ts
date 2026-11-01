export type IosInstallMode = "safari" | "open-safari" | null;

export interface IosBrowserSignals {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
  displayModeStandalone: boolean;
}

/** UA hints choose instructions, never grant capabilities or access. Webviews can mimic Safari. */
export function iosInstallMode(signals: IosBrowserSignals): IosInstallMode {
  if (signals.standalone || signals.displayModeStandalone) return null;
  const ios =
    /iPhone|iPad|iPod/i.test(signals.userAgent) ||
    (/Macintosh/i.test(signals.userAgent) && signals.maxTouchPoints > 1);
  if (!ios) return null;
  const otherBrowser = /WhatsApp|CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA\//i.test(
    signals.userAgent,
  );
  const safari = /Version\/\S+/.test(signals.userAgent) && /Safari\//.test(signals.userAgent);
  return safari && !otherBrowser ? "safari" : "open-safari";
}
