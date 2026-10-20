# Lotline: commercial thesis

## What we sell

A rehearsal of a small food maker's traceability records before a real incident exposes their gaps. The buyer is an operations or quality lead at a small Canadian packaged-food manufacturer using spreadsheets. The first job is to turn receiving, production and shipment CSVs into a reviewed lot lineage and an evidence pack.

The promise to test: **“Find the lot. Follow the records. See what is missing.”** Lotline does not replace a food-safety professional, decide recall scope, or certify compliance.

## Hypotheses, not traction

No customer interviews, paid pilots, signed letters of intent, or active business users have been established. All prices, conversion assumptions and savings below are planning hypotheses. The included business, products and records are synthetic.

| Hypothesis | Proposed test | Decision threshold |
|---|---|---|
| Existing records are sufficient to reconstruct useful lineage | Observe 5 operators perform a mock trace using their current process | At least 3 have identifiable importable records and a recurring gap |
| Setup is easier than changing systems | Supervised pilot using de-identified CSV copies | First reviewed trace in under 30 minutes, including mapping |
| Value recurs beyond one annual drill | Offer weekly import/reconciliation and drill history | At least 2 of 5 pilots use it in 3 separate weeks |
| A narrow product earns a subscription | Offer a clearly scoped paid pilot | At least 2 buyers pay; verbal enthusiasm does not count |

These are proposed thresholds, not completed results.

## Pricing experiment

Test CAD $99/site/month for one site, up to 5,000 records per workspace, record checks and drill exports. Offer a CAD $49 one-off guided drill to learn whether episodic demand is stronger than subscription demand. A CAD $199 optional setup service could cover custom CSV mapping. These are proposed prices; no live billing or free-tier entitlement is implied.

Do not compete by claiming Katana or FoodDocs cannot trace lots: they can. Katana offers a broader manufacturing/inventory workflow; FoodDocs offers broader food-safety operations. The narrow wedge is adoption around existing records, inspectable sources and uncertainty. If imports require continual custom consulting, the subscription thesis weakens.

## Illustrative monthly unit economics

Per CAD $99 account, excluding tax, using assumptions rather than provider quotes:

| Item | Planning allowance |
|---|---:|
| Hosting, database and storage allocation | CAD $8 |
| Optional AI mapping, capped and rate limited | CAD $3 |
| Payment fees | CAD $4 |
| Support: 15 minutes at CAD $40/hour | CAD $10 |
| Contribution before fixed costs/acquisition | CAD $74 (75%) |

The free build/deployment tier is a prototype cost advantage, not evidence that production infrastructure remains free. Optional AI cost should be measured as calls × input/output tokens × current model prices; avoid sending full row contents when column headers suffice. A CAD $3 budget means 20 mapping calls must average at most CAD $0.15 each. Verify this experimentally. Setup, engineering, compliance review, insurance, backups and incident response are excluded and must be budgeted before commercial launch.

At CAD $74 monthly contribution, CAD $200 acquisition cost would imply roughly 2.7 months of contribution payback, before churn. Neither acquisition cost nor retention has been measured. At three hours of support per account, these economics become unattractive. Keep onboarding narrow.

## Customer discovery script

“I'm researching how small food makers rehearse traceability. I'm not selling a compliance certification. Could you walk me through the last time you had to trace an ingredient lot?”

1. “What triggered the trace, and who did the work?”
2. “Which records did you open first? Could you show a blank or de-identified example?”
3. “Where did you lose time or need to ask another person?”
4. “How did you determine which finished batches and shipments were connected?”
5. “What did you do when a lot code or quantity was missing?”
6. “How did you record the drill and its unresolved questions?”
7. “What tools or consultants do you pay for today?”
8. “Who could approve a small paid pilot, and what would it need to demonstrate?”

Then show a synthetic Lotline trace and ask: “What is wrong or missing for your workflow?” Ask for a paid pilot only after understanding the existing process. Obtain permission and a data-handling agreement before importing actual records. Never invent interview quotes.

## Route to market and durable advantage

Start with independent food-safety consultants and shared manufacturing facilities as prospective referral channels; none are confirmed partners. Offer a synthetic drill template that helps an operator evaluate their own records before uploading anything. The potential advantage is a library of reviewed mappings and reconciliation rules plus reliable workflow fit. It is not an established moat, proprietary dataset, or network effect. Cross-customer learning must never leak customer records.

## Production gate

Before selling for live operational use, validate tenant isolation, durable save/recovery, exports, data retention/deletion, access controls and region requirements; conduct practitioner review; test ambiguous/missing lots, duplicate identifiers, units, returns and rework. State supported scenarios precisely. An operational rehearsal must never falsely reassure a maker that its records prove the full scope of an incident.

## Sources

- [CFIA traceability guidance](https://inspection.canada.ca/en/food-safety-industry/toolkit-food-businesses/traceability)
- [Katana Traceability Explorer](https://support.katanamrp.com/en/articles/14737323-how-to-use-the-traceability-explorer)
- [FoodDocs pricing and scope](https://www.fooddocs.com/pricing)
