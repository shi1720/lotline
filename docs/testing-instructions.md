# Lotline application testing instructions

Open **https://lotline-trace.web.app** in a current desktop or mobile browser. No invitation, payment, API key or account is needed for the public sample. Use fictional or de-identified records when testing.

## Guest sample, about three minutes

1. Open the sample trace and select sesame lot **SES-104**.
2. Confirm two linked production batches, three customers, **650 cases recorded as shipped**, a **250-case calculated stock balance** and one separate unresolved shipment. The receipt is 100 kg and the recorded ingredient use is 90 kg.
3. Open a receipt or production card. Inspect the original CSV cells, filename and row reference. Close the evidence dialog.
4. Open the review findings. Inspect the **40-case Cedar Market shipment** with no batch assignment. Leave it unresolved unless independent original documentation establishes its batch. The sample deliberately does not provide that missing evidence.
5. Open **Source records**. Switch between receiving, production and shipments. Download a sample CSV.
6. Open **Import CSV**, choose the matching record type, select the downloaded file and inspect its mapping/preview. Cancel to keep the original sample unchanged, or use Replace for that record type. Appending the same sample would deliberately trigger duplicate-record protection.
7. Open **Export trace**. Download the CSV and complete evidence JSON. Confirm the unresolved shipment is present and separate from confirmed totals. Use the print-ready report and choose Save as PDF in the browser print dialog.

Expected interpretation: the forty unresolved cases do not silently increase the confirmed 650-case total or reduce the calculated 250-case balance. The sample is fictional. A calculated balance is not a physical count or a safety decision.

## Optional account and saved workflow

1. Choose sign-in and create an account using your own email, name and a password of at least eight characters, or sign in to an existing account. No shared judge credentials are required.
2. Save the sample as a new private workspace with a recognizable name.
3. Reload the page. Open the workspace picker and reopen the saved workspace. Confirm the same records and unresolved finding remain.
4. Open **Drill history**, create a rehearsal and add a reviewer note such as: `Synthetic test. Missing shipment batch remains unresolved.` Save the snapshot.
5. Open the saved rehearsal and download its snapshot JSON. Confirm it contains the stored source dataset, result, selected lot and revision.
6. Change a copy of the workspace and save it. Confirm the earlier rehearsal retains its original evidence. Do not overwrite the original sample merely to remove its warning.
7. Sign out. Confirm saved workspace access requires sign-in. Sign back in to recover the saved workspace.
8. Delete the test workspace when finished. Workspace deletion does not itself delete the Firebase Authentication account.

If sign-in fails, confirm the email/password and try password reset. Do not publish credentials, tokens or private customer records in a bug report. Export unsaved work before refreshing if you need to preserve a local change.

## Edge cases worth testing

- Malformed CSV, invalid calendar dates and nonnumeric quantities produce understandable errors without partially changing records.
- Missing lot/batch values remain visible for investigation; required identity fields cannot be blank.
- Incompatible units, impossible linked dates, negative balances and conflicting batch output block quantity assurance.
- Source filenames and physical row references remain correct for quoted multiline CSV cells.
- At mobile width, navigation, cards, tables, evidence dialogs and exports remain usable. Check keyboard focus and Escape behavior on desktop.
- With two accounts, a workspace saved by one must not appear in the other's picker or be retrievable through its private API.

The final case requires two genuine accounts and is distinct from automated injected-identity tests. Record actual outcomes in `docs/verification.md`; this checklist is not a statement that every step has passed.
