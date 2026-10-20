# Lotline operator guide

## Start with the synthetic rehearsal

Open **Trace workspace**. Cedar & Crumb is fictional, and the page labels the sample as synthetic. The ingredient selector starts at **SES-104 — Sesame seeds**.

The confirmed record trail connects Northfield Ingredients' 100 kg receipt to CR-201 and CR-202, two Sesame Crunch batches. Their recorded inputs total 90 kg; recorded output is 900 cases. Confirmed shipments total 650 cases to Cedar Market, Harbour Foods and Maple Co-op. The calculated finished balance is 250 cases. The missing-batch 40-case shipment is a separate unresolved question, not an adjustment silently applied to those totals.

Click a supplier, production or customer card to open the evidence dialog. It shows source filenames and row numbers, with Original CSV row displayed separately from normalized/current fields and any reviewed correction. CSV imports preserve mapped and unmapped cells, including whitespace and multiline content; line endings are normalized to LF. Close it to return to the trace. Use **Source records** to inspect receiving, production and shipment tables and download the three sample CSVs.

## Import your own structured records

Begin with de-identified test copies. Lotline has not been reviewed for real customer operational use; confirm privacy and hosting suitability before uploading confidential data.

1. Choose **Use your own records** to start an empty dataset, or open the workspace switcher and choose **New workspace**. Unsaved changes may be discarded after confirmation.
2. In **Connect your source records**, select Receiving, Production or Shipments.
3. Choose a UTF-8 CSV smaller than 1 MB. Excel/Google Sheets files must first be exported as CSV; direct XLSX upload is not implemented.
4. Inspect the preview and map each expected field to an actual source column. Download a sample for the exact structure. Columns must be uniquely named. All expected fields require a mapped source column, although missing lot/batch cell values remain representable for review.
5. Optional: **Suggest mapping** uses the authenticated mapping endpoint. Without a configured model key it honestly returns rules. With a key it sends headers and up to three sample rows to Anthropic. Review each proposed field; the model does not alter record values.
6. Choose Append or Replace for that record type. Select **Review complete — import … rows**. Invalid imports display row/field errors and leave the dataset unchanged.
7. Repeat for the other two record types. Return to **Trace workspace** and choose the lot.

Use real ISO dates such as `2026-10-15`, finite positive numbers, and consistent units. Give suppliers' lots and finished batches distinct workspace-wide identifiers; normalize collisions before importing. Preserve missing values as missing instead of inventing identifiers.

The dataset limit is 5,000 total records, with a separate 1 MiB server JSON limit. File size or request size may constrain usable rows sooner. Saved workspace/snapshot payloads also share a 25 MiB per-account UTF-8 storage cap. At quota, shrinking or equal-size dataset updates and deletion remain available; a clear 409 error prevents writes that would exceed the limit. Error handling protects record integrity but does not determine whether your input is complete.

## Review a missing shipment assignment

Open the trace's review findings, then inspect the original shipment row. The sample's unresolved row is `shipments.csv`, row 5: 40 cases of Sesame Crunch to Cedar Market, with no batch recorded.

If independent original documentation establishes the correct batch, choose it under **Assign only after checking your original record**, enter a nonempty correction note and confirm. Confirmation remains disabled until a note is supplied. The trace recalculates; save the workspace to retain that revision. If the assignment cannot be verified, leave it unresolved. The record remains in exports for review. Never select a batch merely to make the warning disappear.

The correction preserves originalBatch, correctionNote and correctedAt. Evidence and exports distinguish the reviewed assignment from the original imported batch field. Source coordinates still identify the import location; retain the supporting original documentation for the correction.

## Save and return

**Save workspace** starts ChatGPT sign-in if necessary. A temporary sessionStorage draft protects unsaved records through full-page sign-in. On return the draft is validated, restored and removed from sessionStorage. Download an unsaved JSON backup as an additional safeguard. Restoring a backup opens a new workspace and clears the previous active workspace/history association. The public sample does not require login.

After signing in, name and save the workspace. Open the workspace switcher to reopen saved datasets, rename/save the current one, load a sample or delete a workspace. Deletion removes the workspace and its drill/activity records from the application database. Backup retention is governed separately by hosting operations.

Concurrent changes are revision-checked. If a stale-save conflict occurs, export the unsaved JSON, reopen the saved workspace and reconcile changes deliberately. Do not repeatedly overwrite work from another browser.

## Record a drill

Save the dataset before creating a rehearsal. Open **Drill history**, choose **New rehearsal**, and add reviewer notes explaining what was checked, what remains missing, and who owns follow-up. **Save drill snapshot** stores the selected lot's computed trace with its source record set and revision.

Open **Drill history** to inspect recorded rehearsals and **Download snapshot** for the stored JSON. Later workspace edits do not rewrite earlier snapshots. The history is a record of the exercise, not a certificate of readiness. The limit is 100 snapshots per workspace.

## Export the evidence

From **Export trace**, choose:

| Option | Result |
|---|---|
| Trace & distribution CSV | Receiving/production links, confirmed shipments, source coordinates and unresolved shipments |
| Complete evidence JSON | Dataset, calculated trace, findings and export metadata |
| Print-ready review report / PDF | Opens browser print; choose Save as PDF |

Review the print preview before sharing. Keep drill/synthetic labels and unresolved scope visible. These files prepare evidence for your responsible team; they do not notify customers, contact CFIA, initiate a recall or send emails.

## Operational boundaries

This version supports one ingredient-to-finished-batch transformation layer. Stock balance means output less recorded shipments. It excludes unrecorded waste, returns, transfers and rework. An empty or clean result does not prove absence of exposure. Lotline does not decide whether food is safe, whether recall is necessary or whether legal obligations are met.

Consult your qualified food-safety team and actual incident procedures for real events. Read the official [CFIA guidance](https://inspection.canada.ca/en/food-safety-industry/toolkit-food-businesses/traceability) for context; applicability varies by operation.

Read the public [privacy notice](https://lotline-recall.sg127977958.chatgpt.site/privacy) for retention, deletion, temporary drafts, fonts and hosting limitations. No guaranteed storage region or backup deletion promise is implied.
