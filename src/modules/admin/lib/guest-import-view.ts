/** Display-only contract; TICKET-182 owns parsing, validation and persisted previews. */
export type ImportPreviewViewResult =
  | { status: "error"; message: string; errors: { row: number; column: string; message: string }[] }
  | {
      status: "preview";
      id: string;
      digest: string;
      expiresAt: string;
      invitationCount: number;
      guestCount: number;
      households: {
        key: string;
        heading: string;
        members: string[];
        partyLimit: number;
        side: string | null;
        table: string | null;
      }[];
    };
export type ImportCommitViewResult =
  { status: "committed"; count: number; replayed: boolean } | { status: "error"; message: string };
export const GUEST_CSV_MAX_BYTES = 262144;
export async function readGuestCsv(file: File): Promise<string> {
  if (file.size > GUEST_CSV_MAX_BYTES) throw new Error("File exceeds import limit");
  return new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
}
