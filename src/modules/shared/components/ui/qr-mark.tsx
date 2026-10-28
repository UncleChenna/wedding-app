import { cn } from "../../lib/cn";

export interface QrGeometry {
  modules: number;
  side: number;
  path: string;
}

/** Pure SVG renderer; encoding stays on the server, including for client-side enrolment forms. */
export function QrMark({
  geometry,
  label,
  className,
}: {
  geometry: QrGeometry;
  label: string;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${geometry.side} ${geometry.side}`}
      shapeRendering="crispEdges"
      data-qr-modules={geometry.modules}
      className={cn("block aspect-square w-full", className)}
    >
      <rect width={geometry.side} height={geometry.side} className="fill-qr-paper" />
      <path d={geometry.path} className="fill-qr-ink" />
    </svg>
  );
}
