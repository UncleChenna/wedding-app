import palette from "../assets/card/palette.json";
/** The owner's fixed printed artwork, independent of the website's colour scheme. */
export const printedCard = {
  width: 994,
  height: 1400,
  paper: palette.paper,
  ink: palette.ink,
  qrInk: palette.qrInk,
  names: "Uchenna & Adaora",
  date: "Saturday, 19 December 2026",
  ceremony: "12pm · St Paul’s Anglican Church, Apo Resettlement, Abuja",
  reception:
    "2:30pm · Fineworld Recreational Park, Events & Gardens, opposite AYM Shafa fuel station, Apo Resettlement, Abuja",
  replyBy: "17 December 2026",
} as const;

export interface PrintedCardDetails {
  cardNumber: number;
  guestName: string;
  capacity: number;
}

export function formatCardNumber(number: number): string {
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("Invalid card number");
  return String(number).padStart(3, "0");
}
