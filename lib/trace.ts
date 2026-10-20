/** Deterministic record-based exposure tracing. Results describe records, never food safety. */
export interface Receipt {
  id: string;
  ingredient: string;
  lot: string;
  supplier: string;
  receivedDate: string;
  quantity: number;
  unit: string;
  source: string;
  row: number;
  sourceData?: Record<string, string>;
}
export interface Production {
  id: string;
  batch: string;
  product: string;
  ingredient: string;
  lot: string;
  quantity: number;
  unit: string;
  producedDate: string;
  outputQuantity: number;
  outputUnit: string;
  source: string;
  row: number;
  sourceData?: Record<string, string>;
}
export interface Shipment {
  id: string;
  batch: string;
  product: string;
  customer: string;
  email: string;
  shippedDate: string;
  quantity: number;
  unit: string;
  source: string;
  row: number;
  sourceData?: Record<string, string>;
  originalBatch?: string;
  correctionNote?: string;
  correctedAt?: string;
}
export interface Dataset {
  receipts: Receipt[];
  production: Production[];
  shipments: Shipment[];
}
export interface Issue {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  source: string;
  row: number;
}
export interface AffectedBatch {
  batch: string;
  product: string;
  producedDate: string;
  outputQuantity: number;
  outputUnit: string;
  usedQuantity: number;
  unit: string;
  shippedQuantity: number;
  onHandQuantity: number;
  shipments: Shipment[];
  evidence: Production[];
  balanceKnown: boolean;
  shippedQuantityKnown: boolean;
}
export interface TraceResult {
  lot: string;
  ingredient: string;
  supplier: string;
  receipts: Receipt[];
  batches: AffectedBatch[];
  customers: {
    customer: string;
    email: string;
    quantity: number;
    unit: string;
    batches: string[];
  }[];
  uncertainShipments: Shipment[];
  issues: Issue[];
  inputQuantity: number;
  usedQuantity: number;
  remainingQuantity: number;
  unit: string;
  affectedQuantity: number;
  affectedUnit: string;
  affectedShippedQuantity: number;
  affectedOnHandQuantity: number;
  inputQuantityComplete: boolean;
  outputQuantityComplete: boolean;
  quantitativeComplete: boolean;
  ready: boolean;
}
// Lot and batch identifiers are case-sensitive; normalize surrounding whitespace only.
const key = (s: string) => String(s ?? "").trim();
const nameKey = (s: string) => key(s).toLowerCase();
const unitKey = (s: string) =>
  ({
    kilogram: "kg",
    kilograms: "kg",
    kgs: "kg",
    case: "cases",
    lb: "lb",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
  })[key(s).toLowerCase()] ?? key(s).toLowerCase();
const sum = (xs: number[]) =>
  Math.round(xs.reduce((a, b) => a + b, 0) * 1e9) / 1e9;
export function analyze(dataset: Dataset, requestedLot: string): TraceResult {
  const lot = requestedLot.trim(),
    issues: Issue[] = [];
  const rejectedKinds = new Set<string>();
  const issue = (
    severity: Issue["severity"],
    title: string,
    detail: string,
    r?: { source: string; row: number },
  ) =>
    issues.push({
      id: `issue-${issues.length + 1}`,
      severity,
      title,
      detail,
      source: r?.source ?? "Dataset",
      row: r?.row ?? 0,
    });
  const clean = <T extends Receipt | Production | Shipment>(
    rows: T[],
    kind: string,
  ): T[] => {
    const seen = new Set<string>();
    const values = new Set<string>();
    return rows.filter((r) => {
      const semantic = JSON.stringify(
        Object.fromEntries(
          Object.entries(r)
            .filter(([k]) => !["id", "row", "source", "sourceData"].includes(k))
            .sort(),
        ),
      );
      if ((r.id && seen.has(r.id)) || values.has(semantic)) {
        rejectedKinds.add(kind);
        issue(
          "critical",
          "Duplicate record",
          `${kind} record is duplicated; the later row was excluded to avoid double counting.`,
          r,
        );
        return false;
      }
      if (r.id) seen.add(r.id);
      values.add(semantic);
      if (
        !Number.isFinite(r.quantity) ||
        r.quantity < 0 ||
        ("outputQuantity" in r &&
          (!Number.isFinite(r.outputQuantity) || r.outputQuantity < 0))
      ) {
        rejectedKinds.add(kind);
        issue(
          "critical",
          "Invalid quantity",
          `${kind} quantity must be finite and non-negative; row excluded.`,
          r,
        );
        return false;
      }
      if (!key(r.unit) || ("outputUnit" in r && !key(r.outputUnit))) {
        rejectedKinds.add(kind);
        issue(
          "critical",
          "Missing unit",
          `${kind} record has no unit; row excluded.`,
          r,
        );
        return false;
      }
      if (!r.quantity)
        issue(
          "warning",
          "Zero quantity",
          `${kind} record has zero quantity.`,
          r,
        );
      if ("lot" in r && !key(r.lot))
        issue(
          "critical",
          "Missing ingredient lot",
          `${kind} record cannot establish ingredient lineage without a lot.`,
          r,
        );
      if ("batch" in r && !key(r.batch))
        issue(
          "critical",
          "Missing batch",
          `${kind} record cannot establish a finished-product batch.`,
          r,
        );
      return true;
    });
  };
  const receiptsAll = clean(dataset.receipts, "Receipt"),
    production = clean(dataset.production, "Production"),
    shipments = clean(dataset.shipments, "Shipment");
  const receipts = receiptsAll.filter((r) => key(r.lot) === key(lot) && !!lot);
  const selected = production.filter((r) => key(r.lot) === key(lot) && !!lot);
  if (!lot)
    issue("critical", "Lot required", "Enter an ingredient lot to trace.");
  if (!receipts.length)
    issue(
      "critical",
      "No receipt evidence",
      `No valid receipt record was found for lot ${lot || "(empty)"}.`,
    );
  if (!selected.length)
    issue(
      "warning",
      "No production evidence",
      "No production records explicitly reference this lot. This does not establish that the lot was unused.",
    );
  const missingReceiptIdentity = receipts.some((r) => !nameKey(r.ingredient) || !nameKey(r.supplier));
  const missingProductionIdentity = selected.some((r) => !nameKey(r.ingredient) || !nameKey(r.product));
  for (const r of receipts)
    if (!nameKey(r.ingredient) || !nameKey(r.supplier))
      issue("critical", "Missing receipt identity", "Ingredient and supplier names are required to establish the receipt identity.", r);
  for (const r of selected)
    if (!nameKey(r.ingredient) || !nameKey(r.product))
      issue("critical", "Missing production identity", "Ingredient and product names are required to establish the production identity.", r);
  // Dates are calendar days, not timestamps. A same-day receipt may support production.
  // Multiple deliveries remain usable; no arbitrary single receipt is assigned to a use.
  const productionBeforeReceipts = selected.filter((r) =>
    receipts.length > 0 && !receipts.some((receipt) => receipt.receivedDate <= r.producedDate),
  );
  for (const r of productionBeforeReceipts)
    issue("critical", "Production predates receipt evidence", "This production date is before every recorded receipt for the selected lot. Verify the dates and receipt evidence before relying on balances.", r);
  const ingredients = [
    ...new Set(
      [...receipts, ...selected]
        .map((r) => nameKey(r.ingredient))
        .filter(Boolean),
    ),
  ];
  if (ingredients.length > 1)
    issue(
      "critical",
      "Lot identifier collision",
      "This lot appears against multiple ingredients; confirm supplier lot identifiers before acting.",
    );
  const ingredient =
    receipts[0]?.ingredient ?? selected[0]?.ingredient ?? "Unknown ingredient";
  const supplierNames = [
    ...new Set(receipts.map((r) => nameKey(r.supplier)).filter(Boolean)),
  ];
  const supplierCollision = supplierNames.length > 1;
  if (supplierCollision)
    issue(
      "critical",
      "Supplier lot identifier collision",
      "Different suppliers use this lot identifier. Production records do not carry a supplier identity, so their lot links cannot distinguish these receipts. Separate the supplier lots with verified unique identifiers before relying on quantities.",
      receipts[0],
    );
  const supplier =
    [...new Set(receipts.map((r) => r.supplier).filter(Boolean))].join(", ") ||
    "Unknown supplier";
  const units = [
    ...new Set([...receipts, ...selected].map((r) => unitKey(r.unit))),
  ];
  const unit =
    units.length === 1 ? units[0] : units.length ? "mixed" : "unknown";
  if (units.length > 1)
    issue(
      "critical",
      "Incompatible ingredient units",
      "Ingredient balances cannot combine different units. Convert and re-import the source records.",
    );
  const inputEvidenceComplete =
    units.length === 1 &&
    ingredients.length === 1 &&
    !supplierCollision &&
    !missingReceiptIdentity &&
    !missingProductionIdentity &&
    productionBeforeReceipts.length === 0 &&
    receipts.length > 0 &&
    !rejectedKinds.has("Receipt") &&
    !rejectedKinds.has("Production");
  const inputQuantity =
    unit === "mixed" ? 0 : sum(receipts.map((r) => r.quantity));
  const usedQuantity =
    unit === "mixed" ? 0 : sum(selected.map((r) => r.quantity));
  const remainingQuantity = sum([inputQuantity, -usedQuantity]);
  if (remainingQuantity < 0)
    issue(
      "critical",
      "Ingredient balance exceeds receipts",
      `Production uses ${-remainingQuantity} ${unit} more than recorded receipts.`,
    );
  const inputQuantityComplete = inputEvidenceComplete && remainingQuantity >= 0;
  const batchIds = [
    ...new Set(selected.map((r) => key(r.batch)).filter(Boolean)),
  ];
  const batches: AffectedBatch[] = batchIds.map((id) => {
    const evidence = selected.filter((r) => key(r.batch) === id),
      all = production.filter((r) => key(r.batch) === id),
      first = evidence[0];
    const consistent = all.every(
      (r) =>
        nameKey(r.product) === nameKey(first.product) &&
        unitKey(r.outputUnit) === unitKey(first.outputUnit) &&
        r.outputQuantity === first.outputQuantity &&
        r.producedDate === first.producedDate,
    );
    if (!consistent)
      issue(
        "critical",
        "Conflicting batch output",
        `Batch ${first.batch} has inconsistent product, date, output quantity, or output units. Displayed output uses its first affected production row.`,
        first,
      );
    const matching = shipments.filter((r) => key(r.batch) === id);
    let shipmentEvidenceConflict = false;
    for (const r of matching) {
      if (!nameKey(r.product)) {
        shipmentEvidenceConflict = true;
        issue("critical", "Missing shipment product", "A linked shipment has no product identity. Verify the original shipment record.", r);
      }
      if (r.shippedDate < first.producedDate) {
        shipmentEvidenceConflict = true;
        issue("critical", "Shipment predates production", `Shipment for ${first.batch} is dated before its recorded production. The explicit batch link remains visible for investigation.`, r);
      }
    }
    const valid = matching.filter((r) => {
      if (unitKey(r.unit) !== unitKey(first.outputUnit)) {
        issue(
          "critical",
          "Incompatible shipment units",
          `Shipment for ${first.batch} cannot be balanced against ${first.outputUnit}; excluded from quantity totals.`,
          r,
        );
        return false;
      }
      if (nameKey(r.product) && nameKey(r.product) !== nameKey(first.product)) {
        shipmentEvidenceConflict = true;
        issue(
          "critical",
          "Shipment product conflict",
          `Shipment product conflicts with batch ${first.batch}. The explicit batch link remains in the trace.`,
          r,
        );
      }
      return true;
    });
    const shippedQuantityKnown =
      valid.length === matching.length && !rejectedKinds.has("Shipment");
    const balanceEvidenceKnown = consistent && shippedQuantityKnown && !shipmentEvidenceConflict &&
      all.every((r) => !!nameKey(r.product) && !!nameKey(r.ingredient)) &&
      !productionBeforeReceipts.some((r) => key(r.batch) === id);
    const shippedQuantity = sum(valid.map((r) => r.quantity)),
      onHandQuantity = sum([first.outputQuantity, -shippedQuantity]);
    if (onHandQuantity < 0)
      issue(
        "critical",
        "Shipments exceed batch output",
        `Batch ${first.batch} ships more than its recorded output. Negative balance requires reconciliation.`,
        first,
      );
    return {
      batch: first.batch,
      product: first.product,
      producedDate: first.producedDate,
      outputQuantity: first.outputQuantity,
      outputUnit: unitKey(first.outputUnit),
      usedQuantity: sum(evidence.map((r) => r.quantity)),
      unit: units.length === 1 ? unit : "mixed",
      shippedQuantity,
      onHandQuantity,
      shipments: matching,
      evidence,
      balanceKnown: balanceEvidenceKnown && onHandQuantity >= 0,
      shippedQuantityKnown: shippedQuantityKnown && !shipmentEvidenceConflict,
    };
  });
  const products = new Set(batches.map((b) => nameKey(b.product)));
  const knownBatches = new Set(
    production.map((r) => key(r.batch)).filter(Boolean),
  );
  // A known finished batch is not evidence that its ingredient lineage is complete.
  // Only an explicit same-ingredient, different-lot input supports excluding it.
  const unresolvedBatches = new Set(
    [...knownBatches].filter((id) => {
      const inputs = production.filter((r) => key(r.batch) === id);
      const relevant = inputs.some(
        (r) => !nameKey(r.product) || products.has(nameKey(r.product)),
      );
      const ingredientInputs = inputs.filter((r) =>
        ingredients.includes(nameKey(r.ingredient)),
      );
      return (
        relevant &&
        (!ingredientInputs.length || ingredientInputs.some((r) => !key(r.lot)))
      );
    }),
  );
  const uncertainShipments = shipments.filter(
    (r) =>
      (!key(r.batch) ||
        !knownBatches.has(key(r.batch)) ||
        unresolvedBatches.has(key(r.batch))) &&
      !batchIds.includes(key(r.batch)) &&
      (!nameKey(r.product) || products.has(nameKey(r.product))),
  );
  for (const r of uncertainShipments)
    issue(
      "critical",
      "Shipment lineage unresolved",
      `${r.customer || "Unknown customer"} has ${r.quantity} ${r.unit} with unresolved batch or ingredient-lot lineage. Included for investigation; excluded from confirmed totals.`,
      r,
    );
  const outputUnits = [...new Set(batches.map((b) => b.outputUnit))];
  const affectedUnit =
    outputUnits.length === 1
      ? outputUnits[0]
      : outputUnits.length
        ? "mixed"
        : "unknown";
  if (outputUnits.length > 1)
    issue(
      "critical",
      "Incompatible output units",
      "Affected batches use different units. Combined affected totals are unavailable.",
    );
  const customers: TraceResult["customers"] = [];
  for (const b of batches)
    for (const s of b.shipments) {
      const existing = customers.find(
        (c) =>
          nameKey(c.customer) === nameKey(s.customer) &&
          nameKey(c.email) === nameKey(s.email) &&
          c.unit === unitKey(s.unit),
      );
      if (existing) {
        existing.quantity = sum([existing.quantity, s.quantity]);
        if (!existing.batches.includes(b.batch)) existing.batches.push(b.batch);
      } else
        customers.push({
          customer: s.customer,
          email: s.email,
          quantity: s.quantity,
          unit: unitKey(s.unit),
          batches: [b.batch],
        });
      if (!nameKey(s.customer) || !nameKey(s.email))
        issue(
          "warning",
          "Customer contact incomplete",
          "Confirm recipient contact details before sending a notification.",
          s,
        );
    }
  const outputQuantityComplete =
    outputUnits.length === 1 &&
    batches.every((b) => b.balanceKnown) &&
    !rejectedKinds.has("Production");
  issue(
    "info",
    "Record-based scope",
    "Trace covers only uploaded records. On-hand is a calculated balance, not a physical stock count. Unrecorded movements, rework, returns, and cross-contact require separate investigation.",
  );
  return {
    lot,
    ingredient,
    supplier,
    receipts,
    batches,
    customers,
    uncertainShipments,
    issues,
    inputQuantity,
    usedQuantity,
    remainingQuantity,
    unit,
    affectedQuantity:
      affectedUnit === "mixed" ? 0 : sum(batches.map((b) => b.outputQuantity)),
    affectedUnit,
    affectedShippedQuantity:
      affectedUnit === "mixed" ? 0 : sum(batches.map((b) => b.shippedQuantity)),
    affectedOnHandQuantity:
      affectedUnit === "mixed" ? 0 : sum(batches.map((b) => b.onHandQuantity)),
    inputQuantityComplete,
    outputQuantityComplete,
    quantitativeComplete: inputQuantityComplete && outputQuantityComplete,
    ready: receipts.length > 0 && batches.length > 0 && !issues.some((i) => i.severity === "critical"),
  };
}
