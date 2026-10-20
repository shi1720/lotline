import type { Dataset } from "./trace";
export const demoLot = "SES-104";
/** All companies, records, and email addresses are synthetic demonstration data. */
export const demoDataset: Dataset = {
  receipts: [
    {
      id: "r1",
      ingredient: "Sesame seeds",
      lot: "SES-104",
      supplier: "Northfield Ingredients (demo)",
      receivedDate: "2026-10-12",
      quantity: 100,
      unit: "kg",
      source: "receipts.csv",
      row: 2,
    },
    {
      id: "r2",
      ingredient: "Sesame seeds",
      lot: "SES-105",
      supplier: "Northfield Ingredients (demo)",
      receivedDate: "2026-10-14",
      quantity: 80,
      unit: "kg",
      source: "receipts.csv",
      row: 3,
    },
  ],
  production: [
    {
      id: "p1",
      batch: "CR-201",
      product: "Sesame Crunch",
      ingredient: "Sesame seeds",
      lot: "SES-104",
      quantity: 60,
      unit: "kg",
      producedDate: "2026-10-15",
      outputQuantity: 600,
      outputUnit: "cases",
      source: "production.csv",
      row: 2,
    },
    {
      id: "p2",
      batch: "CR-202",
      product: "Sesame Crunch",
      ingredient: "Sesame seeds",
      lot: "SES-104",
      quantity: 30,
      unit: "kg",
      producedDate: "2026-10-16",
      outputQuantity: 300,
      outputUnit: "cases",
      source: "production.csv",
      row: 3,
    },
    {
      id: "p3",
      batch: "CR-203",
      product: "Sesame Crunch",
      ingredient: "Sesame seeds",
      lot: "SES-105",
      quantity: 40,
      unit: "kg",
      producedDate: "2026-10-17",
      outputQuantity: 400,
      outputUnit: "cases",
      source: "production.csv",
      row: 4,
    },
  ],
  shipments: [
    {
      id: "s1",
      batch: "CR-201",
      product: "Sesame Crunch",
      customer: "Cedar Market (demo)",
      email: "cedar@example.com",
      shippedDate: "2026-10-16",
      quantity: 300,
      unit: "cases",
      source: "shipments.csv",
      row: 2,
    },
    {
      id: "s2",
      batch: "CR-201",
      product: "Sesame Crunch",
      customer: "Harbour Foods (demo)",
      email: "harbour@example.com",
      shippedDate: "2026-10-16",
      quantity: 150,
      unit: "cases",
      source: "shipments.csv",
      row: 3,
    },
    {
      id: "s3",
      batch: "CR-202",
      product: "Sesame Crunch",
      customer: "Maple Co-op (demo)",
      email: "maple@example.com",
      shippedDate: "2026-10-17",
      quantity: 200,
      unit: "cases",
      source: "shipments.csv",
      row: 4,
    },
    {
      id: "s4",
      batch: "",
      product: "Sesame Crunch",
      customer: "Cedar Market (demo)",
      email: "cedar@example.com",
      shippedDate: "2026-10-18",
      quantity: 40,
      unit: "cases",
      source: "shipments.csv",
      row: 5,
    },
    {
      id: "s5",
      batch: "CR-203",
      product: "Sesame Crunch",
      customer: "Harbour Foods (demo)",
      email: "harbour@example.com",
      shippedDate: "2026-10-18",
      quantity: 100,
      unit: "cases",
      source: "shipments.csv",
      row: 6,
    },
  ],
};

// Demo source rows use exactly the canonical CSV columns (all record fields except
// application metadata). Numeric source cells remain strings, like CSV imports.
for (const records of Object.values(demoDataset)) {
  for (const record of records) {
    record.sourceData = Object.fromEntries(
      Object.entries(record)
        .filter(([field]) => !["id", "source", "row", "sourceData"].includes(field))
        .map(([field, value]) => [field, String(value)]),
    );
  }
}
