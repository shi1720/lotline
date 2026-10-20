import { z } from "zod";

export const printable = (max = 240) =>
  z
    .string()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u001f\u007f-\u009f]/.test(v),
      "Use printable text without control characters.",
    );
// Reviewer prose may contain LF newlines. Other control bytes remain forbidden.
export const multilineNote = (max: number) =>
  z
    .string()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0009\u000b-\u001f\u007f-\u009f]/.test(v),
      "Only printable text and line breaks are allowed.",
    );
const nonempty = (max = 240) =>
  printable(max).refine((v) => v.trim().length > 0, "Must not be blank.");
export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Must be a real ISO calendar date (YYYY-MM-DD).");
const sourceKey = nonempty(120).refine(
  (key) => !["__proto__", "constructor", "prototype"].includes(key),
  "This reserved object key cannot be used as a source column.",
);
export const sourceDataSchema = z.record(sourceKey, multilineNote(2000)).refine(
  (row) => Object.keys(row).length <= 80,
  "At most 80 source columns are supported.",
);
const quantity = z.number().finite().positive().max(1_000_000_000);
const common = {
  id: nonempty(512),
  source: nonempty(240),
  row: z.number().int().min(1).max(1_000_000),
  quantity,
  unit: nonempty(40),
  sourceData: sourceDataSchema.optional(),
};
export const receiptSchema = z
  .object({
    ...common,
    ingredient: nonempty(),
    lot: printable(120),
    supplier: nonempty(),
    receivedDate: isoDate,
  })
  .strict();
export const productionSchema = z
  .object({
    ...common,
    batch: printable(120),
    product: nonempty(),
    ingredient: nonempty(),
    lot: printable(120),
    producedDate: isoDate,
    outputQuantity: quantity,
    outputUnit: nonempty(40),
  })
  .strict();
export const shipmentSchema = z
  .object({
    ...common,
    batch: printable(120),
    product: nonempty(),
    customer: printable(),
    email: printable(320),
    shippedDate: isoDate,
    originalBatch: printable(120).optional(),
    correctionNote: multilineNote(1000)
      .refine(
        (value) => value.trim().length > 0,
        "Describe the source evidence for this correction.",
      )
      .optional(),
    correctedAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict()
  .superRefine((row, ctx) => {
    if (
      [row.originalBatch, row.correctionNote, row.correctedAt].some(
        (value) => value !== undefined,
      ) &&
      [row.originalBatch, row.correctionNote, row.correctedAt].some(
        (value) => value === undefined,
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "A correction requires originalBatch, correctionNote, and correctedAt together.",
      });
    }
  });
export const datasetSchema = z
  .object({
    receipts: z.array(receiptSchema).max(5000),
    production: z.array(productionSchema).max(5000),
    shipments: z.array(shipmentSchema).max(5000),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      data.receipts.length + data.production.length + data.shipments.length >
      5000
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A workspace supports at most 5,000 total records.",
      });
  });
export const createWorkspaceSchema = z
  .object({ name: nonempty(120), dataset: datasetSchema })
  .strict();
export const updateWorkspaceSchema = z
  .object({
    name: nonempty(120).optional(),
    dataset: datasetSchema,
    revision: z.number().int().positive(),
  })
  .strict();
export const eventSchema = z
  .object({ action: nonempty(80), detail: printable(1000) })
  .strict();
export const drillSchema = z
  .object({ lot: nonempty(120), notes: multilineNote(2000).default("") })
  .strict();
export const kindSchema = z.enum(["receipts", "production", "shipments"]);
export const mapSchema = z
  .object({
    kind: kindSchema,
    headers: z.array(nonempty(120)).min(1).max(80),
    sampleRows: z
      .array(
        z
          .record(printable(500))
          .refine(
            (row) => Object.keys(row).length <= 80,
            "At most 80 cells per sample row.",
          ),
      )
      .max(3)
      .default([]),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (new Set(data.headers).size !== data.headers.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Column headers must be unique.",
      });
    if (
      data.sampleRows.some((row) =>
        Object.keys(row).some((key) => !data.headers.includes(key)),
      )
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sample cells must use the supplied headers.",
      });
  });
