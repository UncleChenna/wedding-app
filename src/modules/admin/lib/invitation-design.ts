/** Early feedback only; TICKET-175 remains the authoritative bounded image parser. */
export function validateEditorFile(file: { size: number; type: string }): string | null {
  if (!file.size || file.size > 8 * 1024 * 1024) return "Choose a photo up to 8 MB.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return "Choose a JPEG, PNG or WebP photo.";
  return null;
}
