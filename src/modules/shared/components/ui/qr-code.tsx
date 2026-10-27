import { cn } from "../../lib/cn";
import { qrMatrix, qrPathData, qrViewBoxSize } from "../../lib/qr";

export interface QrCodeProps {
  /** The text to encode, e.g. a signed pass URL. */
  value: string;
  /** Accessible name, e.g. "Gate pass QR code for Ada Lovelace". */
  label: string;
  className?: string;
}

/**
 * A crisp SVG QR code in the theme's `qr-ink` on `qr-paper`, always dark on light with a
 * four-module quiet zone. Nothing may be drawn over the modules. Server-rendered; it is not
 * in the `ui` barrel so client bundles never pull in the encoder.
 */
export function QrCode({ value, label, className }: QrCodeProps) {
  const matrix = qrMatrix(value);
  const side = qrViewBoxSize(matrix);
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      data-qr-modules={matrix.size}
      className={cn("block aspect-square w-full", className)}
    >
      <rect width={side} height={side} className="fill-qr-paper" />
      <path d={qrPathData(matrix)} className="fill-qr-ink" />
    </svg>
  );
}
