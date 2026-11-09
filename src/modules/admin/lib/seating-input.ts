import { z } from "zod";

const positiveInt = z.number().int().min(1).max(2147483647);
export const tableInputSchema = z.strictObject({
  number: positiveInt,
  name: z.string().trim().max(200),
  capacity: positiveInt,
});
export const saveTableSchema = z.strictObject({
  id: z.uuid().nullable(),
  expected: z.string().max(1000).nullable(),
  values: tableInputSchema,
});
export const deleteTableSchema = z.strictObject({ id: z.uuid(), expected: z.string().max(1000) });
export const assignTableSchema = z.strictObject({
  invitationId: z.uuid(),
  expectedTableId: z.uuid().nullable(),
  tableId: z.uuid().nullable(),
});
