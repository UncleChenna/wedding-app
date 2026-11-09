export type ScanFeedback = {
  play?: () => void | Promise<void>;
  vibrate?: (duration: number) => boolean;
};

/** Call after publishing the visual result. Optional feedback never gates that result. */
export function requestScanFeedback(feedback: ScanFeedback): void {
  try {
    void Promise.resolve(feedback.play?.()).catch(() => {
      // Browser policy may reject audio; the visual result remains authoritative.
    });
  } catch {
    // Some browser audio implementations throw before returning a promise.
  }
  try {
    feedback.vibrate?.(80);
  } catch {
    // Unsupported/blocked haptics must not interrupt scanning.
  }
}
