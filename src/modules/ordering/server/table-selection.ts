import "server-only";
import {
  tableErrors,
  tableNumberSchema,
  type SelectedTable,
  type TableSelection,
} from "../lib/table-selection";
import { logger } from "@/modules/shared/lib/logger";

export async function resolveTableSelection(
  input: unknown,
  find: (number: number) => Promise<SelectedTable | null>,
): Promise<TableSelection> {
  const parsed = tableNumberSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid", message: tableErrors.invalid };
  try {
    const table = await find(parsed.data);
    return table
      ? { status: "selected", table }
      : {
          status: "missing",
          message: tableErrors.missing,
        };
  } catch {
    logger.child({ module: "ordering" }).warn("Table lookup unavailable");
    return {
      status: "unavailable",
      message: tableErrors.unavailable,
    };
  }
}
