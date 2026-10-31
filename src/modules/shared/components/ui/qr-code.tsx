import { qrMatrix, qrPathData, qrViewBoxSize } from "../../lib/qr";
import { QrMark } from "./qr-mark";
export interface QrCodeProps {
  value: string;
  label: string;
  className?: string;
}
/** Server encoder; client forms can receive only the serializable geometry for QrMark. */
export function QrCode({ value, label, className }: QrCodeProps) {
  const matrix = qrMatrix(value);
  return (
    <QrMark
      geometry={{ modules: matrix.size, side: qrViewBoxSize(matrix), path: qrPathData(matrix) }}
      label={label}
      className={className}
    />
  );
}
