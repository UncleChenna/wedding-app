"use server";
import "server-only";
import { previewGuestImportAction, commitGuestImportAction } from "./guest-import-actions";
import { toImportPreviewView } from "../lib/guest-import-view-map";
import type { ImportCommitViewResult } from "../lib/guest-import-view";

export async function previewGuestImportUiAction(csv: string) {
  return toImportPreviewView(await previewGuestImportAction(csv));
}
export async function commitGuestImportUiAction(input: {
  previewId: string;
  digest: string;
}): Promise<ImportCommitViewResult> {
  const result = await commitGuestImportAction(input);
  return result.status === "error"
    ? result
    : { status: "committed", count: result.count, replayed: result.replayed };
}
