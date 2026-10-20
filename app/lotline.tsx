"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  Clock3,
  Database,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Leaf,
  Link2,
  Loader2,
  LogOut,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import {
  analyze,
  type Dataset,
  type Receipt,
  type Production,
  type Shipment,
} from "@/lib/trace";
import { demoDataset, demoLot } from "@/lib/demo";
import { parseCSV, importRows, fieldsByKind } from "@/lib/import";
import { datasetSchema } from "@/lib/server-validation";
type Kind = "receipts" | "production" | "shipments";
type Workspace = {
  id: string;
  name: string;
  dataset: Dataset;
  revision: number;
};
type Drill = {
  id: string;
  lot: string;
  createdAt: string;
  notes?: string;
  result?: unknown;
};
const empty: Dataset = { receipts: [], production: [], shipments: [] };
const label = (s: string) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const n = (v: number) =>
  new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 }).format(v);
function download(filename: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvValue(v: unknown) {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
function csv(rows: unknown[][]) {
  return rows.map((r) => r.map(csvValue).join(",")).join("\r\n");
}
async function api(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data: any = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Could not complete request. Please try again.",
    );
  return data;
}
export default function Lotline({
  user,
}: {
  user: { name: string; email: string } | null;
}) {
  const [isSample, setIsSample] = useState(true),
    [correction, setCorrection] = useState<{
      id: string;
      batch: string;
      note: string;
    } | null>(null);
  const [dataset, setDataset] = useState<Dataset>(demoDataset),
    [lot, setLot] = useState(demoLot),
    [tab, setTab] = useState("Trace workspace"),
    [recordKind, setRecordKind] = useState<Kind>("receipts"),
    [query, setQuery] = useState(""),
    [workspaces, setWorkspaces] = useState<Workspace[]>([]),
    [active, setActive] = useState<Workspace | null>(null),
    [name, setName] = useState("Cedar & Crumb"),
    [modal, setModal] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [evidence, setEvidence] = useState<{
      title: string;
      records: unknown[];
    } | null>(null),
    [drills, setDrills] = useState<Drill[]>([]),
    [notes, setNotes] = useState(""),
    [events, setEvents] = useState<any[]>([]),
    [dirty, setDirty] = useState(false),
    [mobile, setMobile] = useState(false);
  const [fileData, setFileData] = useState<{
      headers: string[];
      rows: string[][];
      rowNumbers?: number[];
      name: string;
    } | null>(null),
    [mapping, setMapping] = useState<Record<string, string>>({}),
    [importKind, setImportKind] = useState<Kind>("receipts"),
    [importErrors, setImportErrors] = useState<string[]>([]),
    [importMode, setImportMode] = useState<"append" | "replace">("append");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!modal && !evidence && !correction) return;
    const prior = document.activeElement as HTMLElement | null;
    const dialog = Array.from(
      document.querySelectorAll<HTMLElement>("[role=dialog]"),
    ).at(-1);
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([type=file]),textarea,select,[tabindex="0"]',
        ) ?? [],
      );
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) {
        setModal(null);
        setEvidence(null);
        setCorrection(null);
      }
      if (e.key === "Tab") {
        const items = focusable();
        const first = items[0],
          last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      prior?.focus();
    };
  }, [modal, evidence, Boolean(correction)]);
  const [reportTime, setReportTime] = useState("");
  useEffect(() => setReportTime(new Date().toISOString()), []);
  const result = useMemo(() => analyze(dataset, lot), [dataset, lot]);
  const findings = result.issues.filter((issue) => issue.severity !== "info");
  const lots = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...dataset.receipts.map((r) => r.lot),
            ...dataset.production.map((r) => r.lot),
          ].filter(Boolean),
        ),
      ),
    [dataset],
  );
  const count =
    dataset.receipts.length +
    dataset.production.length +
    dataset.shipments.length;
  const notify = (m: string) => {
    setMessage(m);
  };
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 7000);
    return () => clearTimeout(id);
  }, [message]);
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("lotline-signin-draft");
      if (pending) {
        sessionStorage.removeItem("lotline-signin-draft");
        const d = JSON.parse(pending);
        const checked = datasetSchema.safeParse(d.dataset);
        if (checked.success) {
          setDataset(checked.data);
          setName(String(d.name ?? "My food business").slice(0, 80));
          setLot(String(d.lot ?? checked.data.receipts[0]?.lot ?? ""));
          setDirty(true);
          setIsSample(Boolean(d.isSample));
          notify(
            "Your unsaved records were restored after sign-in. Save this workspace to keep them.",
          );
        }
      }
    } catch {
      notify(
        "Your sign-in draft could not be restored. Use your downloaded backup.",
      );
    }
  }, []);
  useEffect(() => {
    if (user)
      api("/api/workspaces")
        .then((d) => setWorkspaces(d.workspaces ?? []))
        .catch((e) => notify(e.message));
  }, [user]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, [dirty]);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!user) {
      setModal("signin");
      return;
    }
    await run(async () => {
      const d = active
        ? await api("/api/workspaces/" + active.id, "PUT", {
            name,
            dataset,
            revision: active.revision,
          })
        : await api("/api/workspaces", "POST", { name, dataset });
      setActive(d.workspace);
      setDirty(false);
      const list = await api("/api/workspaces");
      setWorkspaces(list.workspaces);
      notify("Workspace saved. Your records are private to your account.");
      setModal(null);
    });
  }
  async function openWorkspace(id: string) {
    if (
      dirty &&
      !window.confirm("Unsaved changes will be lost. Open this workspace?")
    )
      return;
    await run(async () => {
      const d = await api("/api/workspaces/" + id);
      setActive(d.workspace);
      setDataset(d.workspace.dataset);
      setName(d.workspace.name);
      setLot(d.workspace.dataset.receipts[0]?.lot ?? "");
      setDirty(false);
      setModal(null);
      setDrills([]);
      setEvents([]);
      setIsSample(false);
    });
  }
  function changeDataset(next: Dataset) {
    setDataset(next);
    setDirty(true);
  }
  function setDemo() {
    if (
      dirty &&
      !window.confirm("Replace unsaved records with the sample workspace?")
    )
      return;
    setIsSample(true);
    setDataset(demoDataset);
    setName("Cedar & Crumb");
    setActive(null);
    setLot(demoLot);
    setDirty(false);
    setDrills([]);
    setEvents([]);
    setTab("Trace workspace");
    notify(
      "Synthetic sample loaded. No real businesses or customers are represented.",
    );
  }
  async function loadHistory() {
    setTab("Drill history");
    if (active)
      await run(async () => {
        const [d, e] = await Promise.all([
          api("/api/workspaces/" + active.id + "/drills"),
          api("/api/workspaces/" + active.id + "/events"),
        ]);
        setDrills(d.drills ?? []);
        setEvents(e.events ?? []);
      });
  }
  async function recordDrill() {
    if (!user) {
      setModal("signin");
      return;
    }
    if (!active || dirty) {
      notify(
        "Save this workspace first so the drill references a saved record set.",
      );
      return;
    }
    await run(async () => {
      await api("/api/workspaces/" + active.id + "/drills", "POST", {
        lot,
        notes,
      });
      setModal(null);
      notify(
        "Drill snapshot recorded with source evidence and unresolved gaps.",
      );
      await loadHistory();
    });
  }
  function exportCSV() {
    const rows: unknown[][] = [
      [
        "record_type",
        "lot",
        "batch",
        "product",
        "customer",
        "email",
        "quantity",
        "unit",
        "source",
        "source_row",
        "status",
        "original_batch",
        "correction_note",
        "corrected_at",
      ],
    ];
    result.receipts.forEach((r) =>
      rows.push([
        "receipt",
        r.lot,
        "",
        r.ingredient,
        r.supplier,
        "",
        r.quantity,
        r.unit,
        r.source,
        r.row,
        "source",
      ]),
    );
    result.batches.forEach((b) => {
      b.evidence.forEach((r) =>
        rows.push([
          "production",
          r.lot,
          r.batch,
          r.product,
          "",
          "",
          r.quantity,
          r.unit,
          r.source,
          r.row,
          "affected",
        ]),
      );
      b.shipments.forEach((s) =>
        rows.push([
          "shipment",
          lot,
          s.batch,
          s.product,
          s.customer,
          s.email,
          s.quantity,
          s.unit,
          s.source,
          s.row,
          "confirmed link",
          s.originalBatch ?? "",
          s.correctionNote ?? "",
          s.correctedAt ?? "",
        ]),
      );
    });
    result.uncertainShipments.forEach((s) =>
      rows.push([
        "shipment",
        "",
        s.batch,
        s.product,
        s.customer,
        s.email,
        s.quantity,
        s.unit,
        s.source,
        s.row,
        "unresolved — review scope",
        s.originalBatch ?? "",
        s.correctionNote ?? "",
        s.correctedAt ?? "",
      ]),
    );
    download(
      "lotline-" + lot + "-trace.csv",
      csv(
        rows.map((row) => [
          ...row,
          ...Array(Math.max(0, rows[0].length - row.length)).fill(""),
        ]),
      ),
      "text/csv;charset=utf-8",
    );
    notify("Trace CSV exported, including unresolved shipments.");
  }
  async function readFile(file: File) {
    setImportErrors([]);
    if (file.size > 1_000_000) {
      setImportErrors(["Use a CSV file under 1 MB."]);
      return;
    }
    try {
      const parsed = parseCSV(await file.text());
      setFileData({ ...parsed, name: file.name });
      autoMap(importKind, parsed.headers);
    } catch (e) {
      setImportErrors([e instanceof Error ? e.message : "Could not read CSV."]);
    }
  }
  function autoMap(kind: Kind, headers: string[]) {
    const aliases: Record<string, string[]> = {
      lot: ["lot", "lotcode", "ingredientlot", "supplierlot", "lotnumber"],
      batch: ["batch", "batchid", "finishedlot", "productionbatch"],
      quantity: ["quantity", "qty", "amount"],
      receivedDate: ["receiveddate", "received", "date"],
      producedDate: ["produceddate", "productiondate", "date"],
      shippedDate: ["shippeddate", "shipdate", "date"],
      outputQuantity: ["outputquantity", "yield", "casesproduced"],
      outputUnit: ["outputunit", "yieldunit"],
      ingredient: ["ingredient", "material"],
      supplier: ["supplier", "vendor"],
      product: ["product", "sku", "item"],
      customer: ["customer", "buyer", "shipto"],
      email: ["email", "customeremail"],
      unit: ["unit", "uom"],
    };
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    setMapping(
      Object.fromEntries(
        fieldsByKind[kind].map((f) => [
          f,
          headers.find((h) =>
            (aliases[f] ?? [normalize(f)]).includes(normalize(h)),
          ) ?? "",
        ]),
      ),
    );
  }
  async function suggestMapping() {
    if (!user) {
      setModal("signin");
      return;
    }
    if (!fileData) return;
    await run(async () => {
      const d = await api("/api/map", "POST", {
        kind: importKind,
        headers: fileData.headers,
        sampleRows: fileData.rows
          .slice(0, 3)
          .map((row) =>
            Object.fromEntries(
              fileData.headers.map((h, i) => [h, row[i] ?? ""]),
            ),
          ),
      });
      setMapping(d.mapping);
      notify(
        d.explanation ??
          "Mapping suggested using " + d.mode + ". Review before importing.",
      );
    });
  }
  function commitImport() {
    if (!fileData) return;
    try {
      const imported = importRows(
        importKind,
        fileData.headers,
        fileData.rows,
        mapping,
        fileData.name,
        fileData.rowNumbers,
      );
      if (imported.errors.length) {
        setImportErrors(
          imported.errors
            .slice(0, 12)
            .map((e) => `Row ${e.row} · ${e.field}: ${e.message}`),
        );
        return;
      }
      const existing = importMode === "replace" ? [] : dataset[importKind];
      const combined = [...existing, ...imported.records];
      const ids = combined.map((r) => r.id);
      if (new Set(ids).size !== ids.length) {
        setImportErrors([
          "Duplicate record IDs. Remove duplicate rows or use Replace this record type.",
        ]);
        return;
      }
      const next = datasetSchema.safeParse({
        ...dataset,
        [importKind]: combined,
      });
      if (!next.success) {
        setImportErrors(
          next.error.issues
            .slice(0, 10)
            .map((i) => i.path.join(".") + ": " + i.message),
        );
        return;
      }
      changeDataset(next.data);
      setIsSample(false);
      const nextLots = Array.from(
        new Set(
          [
            ...next.data.receipts.map((r) => r.lot),
            ...next.data.production.map((r) => r.lot),
          ].filter(Boolean),
        ),
      );
      if (!nextLots.includes(lot)) setLot(nextLots[0] ?? "");
      setModal(null);
      setTab("Source records");
      setRecordKind(importKind);
      setFileData(null);
      notify(
        `${imported.records.length} records imported. Review the trace, then save your workspace.`,
      );
    } catch (e) {
      setImportErrors([e instanceof Error ? e.message : "Import failed."]);
    }
  }
  const tableRecords = dataset[recordKind].filter((r) =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );
  const headings: Record<Kind, string[]> = {
    receipts: [
      "ingredient",
      "lot",
      "supplier",
      "receivedDate",
      "quantity",
      "unit",
    ],
    production: [
      "product",
      "batch",
      "lot",
      "producedDate",
      "quantity",
      "unit",
      "outputQuantity",
    ],
    shipments: [
      "product",
      "batch",
      "customer",
      "shippedDate",
      "quantity",
      "unit",
    ],
  };
  return (
    <div className="shell">
      <aside className={"sidebar " + (mobile ? "visible" : "")}>
        <a className="brand" href="/" aria-label="Lotline home">
          <span className="brandmark">
            <GitBranch size={22} />
          </span>
          lotline<span className="branddot">.</span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <button
          className="workspace-switch"
          onClick={() => setModal("workspaces")}
        >
          <span className="workspace-avatar">{name.slice(0, 1)}</span>
          <span>
            <strong>{name}</strong>
            <small>
              {active
                ? "Private workspace"
                : isSample
                  ? "Sample food maker"
                  : "Unsaved workspace"}
            </small>
          </span>
          <ChevronDown size={15} />
        </button>
        <nav>
          {[
            { name: "Trace workspace", icon: GitBranch },
            { name: "Source records", icon: Database },
            { name: "Drill history", icon: Clock3 },
          ].map((item) => (
            <button
              key={item.name}
              className={tab === item.name ? "selected" : ""}
              onClick={() => {
                setMobile(false);
                item.name === "Drill history"
                  ? loadHistory()
                  : setTab(item.name);
              }}
            >
              <item.icon size={18} />
              {item.name}
              {item.name === "Source records" && (
                <span className="navcount">{count}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">
            <FlaskConical size={15} /> BUILT FOR THE REHEARSAL
          </span>
          <p>A better time to find a missing link? Before you need it.</p>
          <button onClick={() => setModal("guide")}>
            How Lotline works <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setModal("guide")}>
            <CircleHelp size={18} /> Help & traceability guide
          </button>
          {user ? (
            <button onClick={() => setModal("account")}>
              <span className="user-avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="user-name">{user.name}</span>
              <Settings2 size={15} />
            </button>
          ) : (
            <button onClick={() => setModal("signin")}>
              <span className="user-avatar">SG</span>
              <span>Save your own workspace</span>
              <ArrowUpRight size={15} />
            </button>
          )}
          <small>Created by Shivam Gupta · Build North 2026</small>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu iconbtn"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{tab}</strong>
          </div>
          <div className="top-actions">
            <span className={"status-dot " + (dirty ? "unsaved" : "")}>
              {dirty
                ? "Unsaved changes"
                : active
                  ? "Saved to your account"
                  : isSample
                    ? "Synthetic demo"
                    : "Unsaved workspace"}
            </span>
            <button className="btn small" onClick={save} disabled={busy}>
              {busy ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <ShieldCheck size={15} />
              )}{" "}
              {active ? "Save changes" : "Save workspace"}
            </button>
          </div>
        </header>
        <div className="page-content">
          {isSample && (
            <div className="demo-banner">
              <span>
                <FlaskConical size={16} />
                <strong>
                  Explore a real workflow with synthetic records.
                </strong>{" "}
                Nothing here represents a real recall.
              </span>
              <button
                onClick={() => {
                  if (
                    dirty &&
                    !window.confirm(
                      "Replace unsaved records with an empty workspace?",
                    )
                  )
                    return;
                  setIsSample(false);
                  setName("My food business");
                  setDataset(empty);
                  setLot("");
                  setActive(null);
                  setDirty(true);
                  setModal("import");
                }}
              >
                Use your own records <ArrowRight size={15} />
              </button>
            </div>
          )}
          {tab === "Trace workspace" && (
            <>
              <section className="page-heading">
                <div>
                  <span className="eyebrow">
                    RECALL READINESS, ONE LINK AT A TIME
                  </span>
                  <h1>
                    One ingredient.
                    <br />
                    <span>The whole picture.</span>
                  </h1>
                  <p>
                    Trace a supplier lot to every recorded batch and customer.
                    <br className="desktop-break" /> See the evidence. Find
                    what’s missing. Rehearse with confidence.
                  </p>
                </div>
                <div className="heading-illustration" aria-hidden="true">
                  <div className="illustration-label">
                    EVERY LOT. EVERY LINK.
                  </div>
                  <div className="orbit">
                    <Leaf size={32} />
                    <div className="orbit-node node1">
                      <Database size={18} />
                    </div>
                    <div className="orbit-node node2">
                      <FileCheck2 size={18} />
                    </div>
                    <div className="orbit-node node3">
                      <CheckCheck size={18} />
                    </div>
                  </div>
                  <span className="illustration-caption">
                    From ingredient to impact.
                  </span>
                </div>
              </section>
              <section className="trace-controls">
                <div>
                  <label htmlFor="lot-select">TRACE AN INGREDIENT LOT</label>
                  <div className="lot-select-wrap">
                    <span className="tiny-icon">
                      <Search size={18} />
                    </span>
                    <select
                      id="lot-select"
                      value={lot}
                      onChange={(e) => setLot(e.target.value)}
                    >
                      {!lots.length && (
                        <option value="">Import records to begin</option>
                      )}
                      {lots.map((l) => (
                        <option key={l} value={l}>
                          {l} —{" "}
                          {dataset.receipts.find((r) => r.lot === l)
                            ?.ingredient ?? "Unmatched ingredient"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </div>
                <div className="trace-meta">
                  <span className="live-dot" /> Calculated from your records
                  <span className="trace-meta-sub">
                    Exact lot matching · source-linked results
                  </span>
                </div>
                <button
                  className="btn dark"
                  onClick={() => setModal("export")}
                  disabled={!lot}
                >
                  <ArrowDownToLine size={16} /> Export trace
                </button>
              </section>
              {!lot ? (
                <div className="empty-state">
                  <Database size={36} />
                  <h2>Your first trace starts with your records.</h2>
                  <p>
                    Import receiving, production, and shipment CSVs, or explore
                    the sample.
                  </p>
                  <button
                    className="btn dark"
                    onClick={() => setModal("import")}
                  >
                    Import records
                  </button>
                  <button className="btn" onClick={setDemo}>
                    Load sample workspace
                  </button>
                </div>
              ) : (
                <>
                  <div className="metrics">
                    <Metric
                      label="Linked production batches"
                      value={String(result.batches.length)}
                      detail={
                        result.inputQuantityComplete
                          ? `${n(result.usedQuantity)} ${result.unit} of ingredient recorded`
                          : "Ingredient quantities require review"
                      }
                      icon={<GitBranch size={18} />}
                    />
                    <Metric
                      label="Customers in the trace"
                      value={String(result.customers.length)}
                      detail={
                        result.outputQuantityComplete
                          ? `${n(result.affectedShippedQuantity)} ${result.affectedUnit || "units"} recorded as shipped`
                          : "Shipped quantity requires unit review"
                      }
                      icon={<ArrowUpRight size={18} />}
                    />
                    <Metric
                      label="Calculated stock balance"
                      value={
                        result.outputQuantityComplete
                          ? n(result.affectedOnHandQuantity)
                          : "Unknown"
                      }
                      suffix={
                        result.outputQuantityComplete
                          ? result.affectedUnit
                          : undefined
                      }
                      detail={
                        result.uncertainShipments.length
                          ? "Unassigned shipments excluded from balance"
                          : "Produced less recorded shipments"
                      }
                      icon={<Database size={18} />}
                    />
                    <Metric
                      label="Unassigned shipments"
                      value={String(result.uncertainShipments.length)}
                      detail="Could widen the affected scope"
                      warning={result.uncertainShipments.length > 0}
                      icon={<TriangleAlert size={18} />}
                    />
                  </div>
                  <section className="panel lineage-panel">
                    <div className="panel-heading">
                      <div>
                        <span className="eyebrow">FOLLOW THE CONNECTIONS</span>
                        <h2>The lot’s journey</h2>
                      </div>
                      <div className="legend">
                        <span>
                          <i /> Confirmed record link
                        </span>
                        <span>
                          <i className="uncertain" /> Needs review
                        </span>
                      </div>
                    </div>
                    <div className="lineage-labels">
                      <span>01 &nbsp; SUPPLIER LOT</span>
                      <span>02 &nbsp; PRODUCTION BATCHES</span>
                      <span>03 &nbsp; CUSTOMERS</span>
                    </div>
                    <div className="lineage">
                      <div className="lineage-column supplier-column">
                        <button
                          className="lot-card origin-card"
                          onClick={() =>
                            setEvidence({
                              title: "Receiving evidence · " + lot,
                              records: result.receipts,
                            })
                          }
                        >
                          <span className="card-icon">
                            <Leaf size={18} />
                          </span>
                          <small>INGREDIENT LOT</small>
                          <h3>{lot}</h3>
                          <p>
                            {result.ingredient || "Ingredient not recorded"}
                          </p>
                          <div className="card-divider" />
                          <span className="card-line">
                            {result.supplier || "No receiving record"}
                          </span>
                          <strong className="card-quantity">
                            {result.inputQuantityComplete
                              ? n(result.inputQuantity)
                              : "Unknown"}{" "}
                            <span>
                              {result.inputQuantityComplete
                                ? result.unit + " received"
                                : "quantity requires review"}
                            </span>
                          </strong>
                          <span className="source-link">
                            <FileText size={13} />
                            {result.receipts.length} source{" "}
                            {result.receipts.length === 1
                              ? "record"
                              : "records"}
                            <ArrowUpRight size={13} />
                          </span>
                        </button>
                        <div className="balance-note">
                          <span>
                            {result.inputQuantityComplete
                              ? `${n(result.remainingQuantity)} ${result.unit}`
                              : "Unknown"}
                          </span>{" "}
                          ingredient balance
                          <br />
                          <small>Assumes these are all usage records.</small>
                        </div>
                      </div>
                      <div className="lineage-column batch-column">
                        {result.batches.length === 0 && (
                          <div className="blank-card">
                            No linked production records.
                            <br />
                            An empty trace does not establish no exposure.
                          </div>
                        )}
                        {result.batches.map((b) => (
                          <button
                            key={b.batch}
                            className="lot-card batch-card"
                            onClick={() =>
                              setEvidence({
                                title: "Production evidence · " + b.batch,
                                records: b.evidence,
                              })
                            }
                          >
                            <span className="batch-top">
                              <span className="small-chip">PRODUCTION</span>
                              <ArrowUpRight size={15} />
                            </span>
                            <h3>{b.batch}</h3>
                            <p>{b.product}</p>
                            <div className="batch-bottom">
                              <span>
                                <strong>
                                  {b.balanceKnown
                                    ? n(b.outputQuantity)
                                    : "Review"}
                                </strong>{" "}
                                {b.balanceKnown
                                  ? b.outputUnit
                                  : "units / output"}
                              </span>
                              <span>
                                {result.inputQuantityComplete
                                  ? `${n(b.usedQuantity)} ${b.unit} used`
                                  : "Input requires review"}
                              </span>
                            </div>
                            <span className="source-link">
                              <FileText size={13} />
                              {b.evidence[0]?.source} · row {b.evidence[0]?.row}
                            </span>
                          </button>
                        ))}
                      </div>
                      <div className="lineage-column customer-column">
                        {result.customers.map((c, i) => (
                          <button
                            key={c.customer + "-" + i}
                            className="customer-card"
                            onClick={() =>
                              setEvidence({
                                title: "Distribution evidence · " + c.customer,
                                records: result.batches.flatMap((b) =>
                                  b.shipments.filter(
                                    (s) => s.customer === c.customer,
                                  ),
                                ),
                              })
                            }
                          >
                            <span className="customer-avatar">
                              {c.customer.slice(0, 1)}
                            </span>
                            <span>
                              <strong>{c.customer}</strong>
                              <small>{c.batches.join(" · ")}</small>
                            </span>
                            <span className="customer-quantity">
                              {n(c.quantity)}
                              <small>{c.unit}</small>
                            </span>
                            <ArrowUpRight size={14} />
                          </button>
                        ))}
                        {result.uncertainShipments.length > 0 && (
                          <button
                            className="uncertain-card"
                            onClick={() => {
                              setTab("Review queue");
                            }}
                          >
                            <TriangleAlert size={19} />
                            <span>
                              <strong>
                                {result.uncertainShipments.length} shipment
                                needs a closer look
                              </strong>
                              <small>
                                Lot assignment missing or unresolved
                              </small>
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="lineage-footer">
                      <Link2 size={15} />
                      <span>
                        Every solid connection comes from an exact recorded lot
                        or batch ID. Click any card to inspect its source record
                        and any verified correction.
                      </span>
                    </div>
                  </section>
                  <div className="bottom-grid">
                    <section className="panel review-panel">
                      <div className="panel-heading">
                        <div>
                          <span className="eyebrow">
                            CONFIDENCE HAS BOUNDARIES
                          </span>
                          <h2>
                            {findings.length
                              ? "A few links need attention."
                              : "Review the record set."}
                          </h2>
                        </div>
                        <span className="badge amber">
                          {findings.length}{" "}
                          {findings.length === 1 ? "finding" : "findings"}
                        </span>
                      </div>
                      <p>
                        Missing records can change the scope. Resolve these
                        before relying on this trace.
                      </p>
                      {findings.slice(0, 2).map((i) => (
                        <button
                          className="issue-preview"
                          key={i.id}
                          onClick={() => setTab("Review queue")}
                        >
                          <TriangleAlert size={17} />
                          <span>
                            <strong>{i.title}</strong>
                            <small>
                              {i.source
                                ? `${i.source} · row ${i.row}`
                                : "Record completeness check"}
                            </small>
                          </span>
                          <ArrowRight size={15} />
                        </button>
                      ))}
                      {!findings.length && (
                        <div className="good-note">
                          <Check size={18} /> No automated findings.
                          Completeness still needs human verification.
                        </div>
                      )}
                      <button
                        className="text-link"
                        onClick={() => setTab("Review queue")}
                      >
                        Review all findings <ArrowRight size={15} />
                      </button>
                    </section>
                    <section className="drill-card">
                      <div className="drill-icon">
                        <FlaskConical size={23} />
                      </div>
                      <span className="eyebrow">PRACTICE THE HARD DAY</span>
                      <h2>
                        Make the drill
                        <br />
                        worth doing.
                      </h2>
                      <p>
                        Capture what you know, what you don’t, and the records
                        behind both.
                      </p>
                      <button className="btn" onClick={() => setModal("drill")}>
                        Record a recall rehearsal <ArrowRight size={16} />
                      </button>
                      <small>
                        A preparation tool. Recall and safety decisions stay
                        with your responsible team.
                      </small>
                    </section>
                  </div>
                </>
              )}
            </>
          )}
          {tab === "Source records" && (
            <>
              <SectionHeading
                eyebrow="YOUR RECORDS, CONNECTED"
                title="The evidence underneath."
                description="Receiving, production, and distribution records form the trace. Keep the source with every link."
              />
              <div className="section-toolbar">
                <div className="segmented">
                  {(["receipts", "production", "shipments"] as Kind[]).map(
                    (k) => (
                      <button
                        className={recordKind === k ? "active" : ""}
                        key={k}
                        onClick={() => setRecordKind(k)}
                      >
                        {k === "receipts" ? "Receiving" : label(k)}{" "}
                        <span>{dataset[k].length}</span>
                      </button>
                    ),
                  )}
                </div>
                <button
                  className="btn dark"
                  onClick={() => {
                    setImportKind(recordKind);
                    setFileData(null);
                    setImportErrors([]);
                    setModal("import");
                  }}
                >
                  <Upload size={16} /> Import CSV
                </button>
              </div>
              <div className="panel records-panel">
                <div className="table-search">
                  <Search size={17} />
                  <input
                    aria-label="Search records"
                    placeholder="Search lots, products, customers…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <span>{tableRecords.length} records</span>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {headings[recordKind].map((h) => (
                          <th key={h}>{label(h)}</th>
                        ))}
                        <th>Evidence</th>
                        <th>
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRecords.map((r: any) => (
                        <tr key={r.id}>
                          {headings[recordKind].map((h) => (
                            <td key={h}>
                              {r[h] !== "" ? (
                                String(r[h] ?? "—")
                              ) : (
                                <span className="badge amber">Missing</span>
                              )}
                            </td>
                          ))}
                          <td>
                            <button
                              className="source-pill"
                              onClick={() =>
                                setEvidence({
                                  title: "Original source record",
                                  records: [r],
                                })
                              }
                            >
                              {r.source}:{r.row}
                              <ArrowUpRight size={12} />
                            </button>
                          </td>
                          <td>
                            <button
                              className="iconbtn"
                              aria-label={"Remove record " + r.id}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Remove this record? The trace will recalculate.",
                                  )
                                )
                                  changeDataset({
                                    ...dataset,
                                    [recordKind]: dataset[recordKind].filter(
                                      (x) => x.id !== r.id,
                                    ),
                                  });
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!tableRecords.length && (
                    <div className="empty-state">
                      <FileSpreadsheet size={30} />
                      <h3>No records here yet.</h3>
                      <p>Import a CSV or adjust your search.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="source-downloads">
                <FileSpreadsheet size={20} />
                <div>
                  <strong>Start with a familiar spreadsheet.</strong>
                  <p>
                    Download the example files to see the supported structure.
                    All sample data is synthetic.
                  </p>
                </div>
                {(["receipts", "production", "shipments"] as Kind[]).map(
                  (k) => (
                    <a
                      className="btn small"
                      key={k}
                      href={"/samples/" + k + ".csv"}
                      download
                    >
                      {label(k)} <ArrowDownToLine size={14} />
                    </a>
                  ),
                )}
              </div>
            </>
          )}
          {tab === "Review queue" && (
            <>
              <SectionHeading
                eyebrow="UNCERTAINTY, MADE VISIBLE"
                title="Close the missing links."
                description="A smaller affected list is only useful when the evidence supports it. These findings are part of the result."
              />
              <button
                className="text-link"
                onClick={() => setTab("Trace workspace")}
              >
                <ArrowLeft size={16} /> Back to trace
              </button>
              <div className="review-list">
                {result.issues.map((i) => (
                  <article className="panel full-issue" key={i.id}>
                    <span className={"issue-icon " + i.severity}>
                      <TriangleAlert size={22} />
                    </span>
                    <div>
                      <span className="eyebrow">
                        {i.severity} ·{" "}
                        {i.source ? `${i.source} : ${i.row}` : "Dataset check"}
                      </span>
                      <h3>{i.title}</h3>
                      <p>{i.detail}</p>
                    </div>
                  </article>
                ))}
                {!findings.length && (
                  <div className="empty-state">
                    <CheckCheck size={32} />
                    <h2>No automated findings.</h2>
                    <p>
                      Verify that all receiving, usage, inventory movements, and
                      shipments have been supplied.
                    </p>
                  </div>
                )}
              </div>
              {result.uncertainShipments.map((s) => (
                <div className="panel resolve-card" key={s.id}>
                  <div>
                    <span className="badge amber">UNASSIGNED SHIPMENT</span>
                    <h3>
                      {s.customer} · {n(s.quantity)} {s.unit}
                    </h3>
                    <p>
                      {s.product} · {s.source}, row {s.row}
                    </p>
                    <button
                      className="text-link"
                      onClick={() =>
                        setEvidence({
                          title: "Unresolved shipment evidence",
                          records: [s],
                        })
                      }
                    >
                      Inspect source <ArrowUpRight size={14} />
                    </button>
                  </div>
                  <div>
                    <label htmlFor={"resolve-" + s.id}>
                      Assign only after checking your original record
                    </label>
                    <select
                      id={"resolve-" + s.id}
                      defaultValue=""
                      onChange={(e) => {
                        if (!e.target.value) return;
                        setCorrection({
                          id: s.id,
                          batch: e.target.value,
                          note: "",
                        });
                      }}
                    >
                      <option value="">Choose a verified batch…</option>
                      {Array.from(
                        new Set(
                          dataset.production
                            .filter((p) => p.product === s.product)
                            .map((p) => p.batch),
                        ),
                      ).map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <div className="notice">
                <ShieldCheck size={20} />
                <p>
                  Do not assign a batch by guesswork. If you cannot verify a
                  link, include the shipment in the review scope and keep the
                  uncertainty in your export.
                </p>
              </div>
            </>
          )}
          {tab === "Drill history" && (
            <>
              <SectionHeading
                eyebrow="A RECORD OF THE REHEARSAL"
                title="Know how ready you were."
                description="Saved snapshots preserve the trace and open questions at the time of each drill."
              />
              <div className="section-toolbar">
                <span className="muted">
                  {active
                    ? name
                    : "Save a workspace to keep drill history across sessions."}
                </span>
                <button className="btn dark" onClick={() => setModal("drill")}>
                  <Plus size={16} /> New rehearsal
                </button>
              </div>
              {drills.length ? (
                drills.map((d) => (
                  <article className="panel drill-history" key={d.id}>
                    <div className="drill-icon">
                      <FlaskConical size={23} />
                    </div>
                    <div>
                      <span className="eyebrow">RECORDED REHEARSAL</span>
                      <h3>Ingredient lot {d.lot}</h3>
                      <p>
                        {new Date(d.createdAt).toLocaleString()} ·{" "}
                        {d.notes || "No reviewer notes"}
                      </p>
                    </div>
                    <button
                      className="btn"
                      onClick={() =>
                        run(async () => {
                          const snapshot = await api(
                            "/api/workspaces/" + active?.id + "/drills/" + d.id,
                          );
                          download(
                            "lotline-drill-" + d.id + ".json",
                            JSON.stringify(snapshot.drill, null, 2),
                            "application/json",
                          );
                        })
                      }
                    >
                      Download snapshot <ArrowDownToLine size={15} />
                    </button>
                  </article>
                ))
              ) : (
                <div className="panel empty-state">
                  <Clock3 size={35} />
                  <h2>Your first rehearsal belongs here.</h2>
                  <p>
                    Save a workspace, review a lot, then record a drill with
                    your notes.
                  </p>
                  <button className="btn" onClick={save}>
                    Save workspace
                  </button>
                </div>
              )}
              {events.length > 0 && (
                <section className="panel audit-panel">
                  <h2>Workspace activity</h2>
                  {events.slice(0, 20).map((e: any) => (
                    <div key={e.id} className="audit-row">
                      <span className="live-dot" />
                      <strong>{label(e.action ?? "Updated")}</strong>
                      <span>{e.detail}</span>
                      <small>{new Date(e.createdAt).toLocaleString()}</small>
                    </div>
                  ))}
                </section>
              )}
            </>
          )}
          <footer className="page-footer">
            <span>
              <span className="footer-logo">lotline.</span> Every lot. Every
              link.
            </span>
            <span>
              Evidence, not assumptions.{" "}
              <button onClick={() => setModal("guide")}>
                Read the boundaries <ArrowUpRight size={12} />
              </button>
            </span>
          </footer>
        </div>
      </main>
      {message && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setMessage("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {evidence && (
        <div className="modal-backdrop" onClick={() => setEvidence(null)}>
          <section
            className="modal evidence-modal"
            role="dialog"
            aria-modal="true"
            aria-label={evidence.title}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader
              title={evidence.title}
              close={() => setEvidence(null)}
            />
            <p className="muted">
              These are the current imported records. A verified batch
              correction preserves its original batch value, reviewer note, and
              correction time below.
            </p>
            {evidence.records.map((r: any, i) => (
              <div className="evidence-record" key={i}>
                <span className="badge green">
                  <FileText size={12} />
                  {r.source} · row {r.row}
                </span>
                <dl>
                  {Object.entries(r)
                    .filter(([k]) => !["source", "row", "id"].includes(k))
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt>{label(k)}</dt>
                        <dd>
                          {String(v) === "" ? (
                            <span className="badge amber">Not recorded</span>
                          ) : (
                            String(v)
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
              </div>
            ))}
            {!evidence.records.length && (
              <p>No receiving evidence was provided for this lot.</p>
            )}
            <button className="btn" onClick={() => setEvidence(null)}>
              Close evidence
            </button>
          </section>
        </div>
      )}
      {correction && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Verify batch correction"
          >
            <ModalHeader
              title="Preserve the evidence."
              close={() => setCorrection(null)}
            />
            <p>
              You are assigning shipment {correction.id} to{" "}
              <strong>{correction.batch}</strong>. Only proceed when your
              original records establish this link.
            </p>
            <label htmlFor="correction-note">
              What source verified this assignment?
            </label>
            <textarea
              id="correction-note"
              rows={4}
              maxLength={1000}
              value={correction.note}
              onChange={(e) =>
                setCorrection({ ...correction, note: e.target.value })
              }
              placeholder="For example: confirmed against signed dispatch note DN-123, row 4."
            />
            <p className="fineprint">
              The imported batch value stays in the record alongside this
              correction. Save the workspace to preserve the revision.
            </p>
            <button
              className="btn dark wide"
              disabled={!correction.note.trim()}
              onClick={() => {
                changeDataset({
                  ...dataset,
                  shipments: dataset.shipments.map((r) =>
                    r.id === correction.id
                      ? {
                          ...r,
                          originalBatch: r.originalBatch ?? r.batch,
                          batch: correction.batch,
                          correctionNote: correction.note.trim(),
                          correctedAt: new Date().toISOString(),
                        }
                      : r,
                  ),
                });
                setCorrection(null);
                notify(
                  "Verified correction added. Save the workspace to keep the revised record.",
                );
              }}
            >
              Confirm verified assignment
            </button>
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-backdrop" onClick={() => !busy && setModal(null)}>
          <section
            className={"modal " + (modal === "import" ? "import-modal" : "")}
            role="dialog"
            aria-modal="true"
            aria-label={
              modal === "import" ? "Import source records" : label(modal)
            }
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader
              title={
                modal === "import"
                  ? "Connect your source records."
                  : modal === "export"
                    ? "Take the evidence with you."
                    : modal === "drill"
                      ? "Record the rehearsal."
                      : modal === "workspaces"
                        ? "Your workspaces."
                        : modal === "signin"
                          ? "Keep every link."
                          : modal === "account"
                            ? "Your private account."
                            : "A clearer picture. Honest boundaries."
              }
              close={() => setModal(null)}
            />
            {modal === "signin" && (
              <>
                <div className="modal-emblem">
                  <ShieldCheck size={32} />
                </div>
                <p>
                  Sign in to save private workspaces, record drill history, and
                  return to your records on another device.
                </p>
                <a
                  className="btn dark wide"
                  href="/signin-with-chatgpt?return_to=%2F"
                  target="_top"
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        "lotline-signin-draft",
                        JSON.stringify({ name, dataset, lot, isSample }),
                      );
                    } catch {
                      notify(
                        "Download a backup before signing in; the browser could not preserve this draft.",
                      );
                    }
                  }}
                >
                  Sign in with ChatGPT <ArrowRight size={17} />
                </a>
                <p className="fineprint">
                  The public sample works without an account. Your imported
                  records stay in this browser session until you save them. A
                  temporary session draft protects your work through sign-in.
                  You can also export a backup.
                </p>
                <button
                  className="btn wide"
                  onClick={() =>
                    download(
                      "lotline-workspace-backup.json",
                      JSON.stringify({ name, dataset }, null, 2),
                      "application/json",
                    )
                  }
                >
                  Download unsaved record backup
                </button>
              </>
            )}
            {modal === "account" && (
              <>
                <p>
                  Signed in as <strong>{user?.email}</strong>. Workspaces are
                  scoped to your account on the server.
                </p>
                <div className="notice">
                  <ShieldCheck size={20} />
                  <p>
                    Data is stored in Cloudflare D1. Records are sent to the
                    model provider only when you explicitly request AI mapping.
                    Do not upload consumer personal or health information.
                  </p>
                </div>
                <a
                  className="btn"
                  href="/signout-with-chatgpt?return_to=%2F"
                  target="_top"
                >
                  <LogOut size={16} /> Sign out
                </a>
              </>
            )}
            {modal === "workspaces" && (
              <>
                <p className="muted">
                  Your saved workspaces are private to your signed-in account.
                </p>
                <label htmlFor="workspace-name">Workspace name</label>
                <input
                  id="workspace-name"
                  maxLength={80}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setDirty(true);
                  }}
                />
                <div className="modal-actions">
                  <button className="btn dark" disabled={busy} onClick={save}>
                    Save current workspace
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      if (dirty && !window.confirm("Discard unsaved changes?"))
                        return;
                      setActive(null);
                      setDataset(empty);
                      setLot("");
                      setName("My food business");
                      setIsSample(false);
                      setDrills([]);
                      setEvents([]);
                      setDirty(true);
                      setModal("import");
                    }}
                  >
                    New workspace
                  </button>
                </div>
                {workspaces.map((w) => (
                  <div className="saved-workspace" key={w.id}>
                    <button onClick={() => openWorkspace(w.id)}>
                      <Database size={18} />
                      <strong>{w.name}</strong>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      aria-label={"Delete " + w.name}
                      className="iconbtn"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Permanently delete this workspace and its drill history?",
                          )
                        )
                          run(async () => {
                            await api("/api/workspaces/" + w.id, "DELETE");
                            setWorkspaces(
                              workspaces.filter((x) => x.id !== w.id),
                            );
                            if (active?.id === w.id) {
                              setActive(null);
                              setDirty(true);
                            }
                            notify("Workspace deleted.");
                          });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  className="text-link"
                  onClick={() => {
                    setDemo();
                    setModal(null);
                  }}
                >
                  Load synthetic sample <ArrowRight size={15} />
                </button>
              </>
            )}
            {modal === "export" && (
              <>
                <p>
                  Export the confirmed links <strong>and</strong> the unresolved
                  scope. These are preparation records for your responsible team
                  to review.
                </p>
                <div className="export-options">
                  <button onClick={exportCSV}>
                    <FileSpreadsheet size={24} />
                    <span>
                      <strong>Trace & distribution CSV</strong>
                      <small>
                        Source rows, affected shipments, and unresolved records
                      </small>
                    </span>
                    <ArrowDownToLine size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setModal(null);
                      setTimeout(() => window.print(), 100);
                    }}
                  >
                    <FileText size={24} />
                    <span>
                      <strong>Print-ready review report / PDF</strong>
                      <small>Use your browser’s Save as PDF option</small>
                    </span>
                    <ArrowDownToLine size={18} />
                  </button>
                  <button
                    onClick={() =>
                      download(
                        "lotline-" + lot + "-evidence.json",
                        JSON.stringify(
                          {
                            schemaVersion: 1,
                            generatedAt: new Date().toISOString(),
                            workspace: name,
                            lot,
                            result,
                            dataset,
                            notice: isSample
                              ? "Synthetic sample. Review required."
                              : "Record-based trace. Completeness and recall decisions require human review.",
                          },
                          null,
                          2,
                        ),
                        "application/json",
                      )
                    }
                  >
                    <Database size={24} />
                    <span>
                      <strong>Complete evidence JSON</strong>
                      <small>Records, findings, and calculated trace</small>
                    </span>
                    <ArrowDownToLine size={18} />
                  </button>
                </div>
              </>
            )}
            {modal === "drill" && (
              <>
                <span className="badge amber">
                  {findings.length} open findings · {lot || "No lot selected"}
                </span>
                <p>
                  A rehearsal snapshot records the current lot trace, source
                  data, and unresolved questions. It does not certify recall
                  readiness.
                </p>
                <label htmlFor="drill-notes">Reviewer notes</label>
                <textarea
                  id="drill-notes"
                  maxLength={2000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What did you verify? What is still missing? Who owns the follow-up?"
                  rows={5}
                />
                <div className="modal-actions">
                  <button
                    className="btn dark"
                    disabled={busy || !lot}
                    onClick={recordDrill}
                  >
                    {busy ? (
                      <Loader2 className="spin" size={16} />
                    ) : (
                      <FileCheck2 size={16} />
                    )}{" "}
                    Save drill snapshot
                  </button>
                  <button className="btn" onClick={save}>
                    Save workspace first
                  </button>
                </div>
              </>
            )}
            {modal === "import" && (
              <>
                <p className="muted">
                  Import existing spreadsheets as UTF-8 CSV. Review the column
                  mapping before adding records. Up to 1 MB per file.
                </p>
                <label htmlFor="import-kind">Record type</label>
                <select
                  id="import-kind"
                  value={importKind}
                  onChange={(e) => {
                    const k = e.target.value as Kind;
                    setImportKind(k);
                    if (fileData) autoMap(k, fileData.headers);
                    setImportErrors([]);
                  }}
                >
                  <option value="receipts">
                    Receiving — ingredient lots from suppliers
                  </option>
                  <option value="production">
                    Production — ingredients used in finished batches
                  </option>
                  <option value="shipments">
                    Shipments — finished batches sent to customers
                  </option>
                </select>
                <div className="upload-zone">
                  <Upload size={27} />
                  <strong>
                    {fileData
                      ? fileData.name
                      : "Bring the spreadsheet you already have."}
                  </strong>
                  <span>
                    {fileData
                      ? `${fileData.rows.length} rows · ${fileData.headers.length} columns`
                      : "CSV files only. Source filename and row numbers stay with your records."}
                  </span>
                  <button
                    className="btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose CSV file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    aria-label="Upload CSV"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) readFile(f);
                    }}
                  />
                </div>
                <div className="sample-line">
                  Need a starting point?{" "}
                  <a href={"/samples/" + importKind + ".csv"} download>
                    Download {importKind} sample <ArrowDownToLine size={12} />
                  </a>
                </div>
                {fileData && (
                  <>
                    <div className="mapping-heading">
                      <h3>Confirm the connections.</h3>
                      <button
                        className="btn small"
                        onClick={suggestMapping}
                        disabled={busy}
                      >
                        <Sparkles size={15} /> Suggest mapping
                      </button>
                    </div>
                    <p className="fineprint">
                      Suggestions may use AI if configured. Clicking sends
                      headers and up to 3 sample rows to the server; configured
                      AI sends them to Anthropic. Review every suggested field.
                    </p>
                    <div className="mapping-grid">
                      {fieldsByKind[importKind].map((field) => (
                        <label key={field}>
                          {label(field)}
                          <select
                            value={mapping[field] ?? ""}
                            onChange={(e) =>
                              setMapping({
                                ...mapping,
                                [field]: e.target.value,
                              })
                            }
                          >
                            <option value="">Not mapped</option>
                            {fileData.headers.map((h) => (
                              <option key={h}>{h}</option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                    <div className="table-scroll preview-table">
                      <table>
                        <thead>
                          <tr>
                            {fileData.headers.map((h) => (
                              <th key={h}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fileData.rows.slice(0, 3).map((r, i) => (
                            <tr key={i}>
                              {r.map((v, j) => (
                                <td key={j}>{v || "—"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <label htmlFor="import-mode">
                      How to add these records
                    </label>
                    <select
                      id="import-mode"
                      value={importMode}
                      onChange={(e) =>
                        setImportMode(e.target.value as "append" | "replace")
                      }
                    >
                      <option value="append">
                        Append to existing {importKind}
                      </option>
                      <option value="replace">
                        Replace all existing {importKind}
                      </option>
                    </select>
                    <button className="btn dark wide" onClick={commitImport}>
                      <Check size={17} /> Review complete — import{" "}
                      {fileData.rows.length} rows
                    </button>
                  </>
                )}
                {importErrors.length > 0 && (
                  <div className="import-errors" role="alert">
                    <strong>
                      Import needs attention. No records were changed.
                    </strong>
                    {importErrors.map((e, i) => (
                      <p key={i}>{e}</p>
                    ))}
                  </div>
                )}
                <div className="sample-line">
                  Workspace backups:{" "}
                  <input
                    type="file"
                    accept="application/json,.json"
                    aria-label="Restore workspace JSON backup"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 1_000_000) {
                        notify("Backup must be under 1 MB.");
                        return;
                      }
                      try {
                        const d = JSON.parse(await f.text());
                        if (
                          !d.dataset ||
                          !Array.isArray(d.dataset.receipts) ||
                          !Array.isArray(d.dataset.production) ||
                          !Array.isArray(d.dataset.shipments)
                        )
                          throw new Error("Invalid workspace backup.");
                        const validated = datasetSchema.parse(d.dataset);
                        if (
                          dirty &&
                          !window.confirm(
                            "Restore this backup as a new unsaved workspace? Current unsaved changes will be replaced.",
                          )
                        )
                          return;
                        setActive(null);
                        setDrills([]);
                        setEvents([]);
                        setIsSample(false);
                        changeDataset(validated);
                        setName(
                          String(d.name ?? "Restored workspace").slice(0, 80),
                        );
                        setLot(d.dataset.receipts[0]?.lot ?? "");
                        setModal(null);
                        notify(
                          "Backup restored. Review and save your workspace.",
                        );
                      } catch {
                        notify(
                          "This backup could not be restored. Use a Lotline workspace backup.",
                        );
                      }
                    }}
                  />
                </div>
              </>
            )}
            {modal === "guide" && (
              <>
                <div className="guide-step">
                  <span>01</span>
                  <div>
                    <h3>Connect the records you already keep.</h3>
                    <p>
                      Import receiving, ingredient usage, and customer
                      shipments. Use exact lot IDs; units must agree. Lotline
                      preserves filenames and row numbers.
                    </p>
                  </div>
                </div>
                <div className="guide-step">
                  <span>02</span>
                  <div>
                    <h3>Trace the evidence, including the gaps.</h3>
                    <p>
                      Choose an ingredient lot. Exact lot and batch IDs create
                      links. Missing assignments remain in a separate review
                      scope. Quantities are arithmetic from supplied records,
                      not a physical stock count.
                    </p>
                  </div>
                </div>
                <div className="guide-step">
                  <span>03</span>
                  <div>
                    <h3>Rehearse, review, and export.</h3>
                    <p>
                      Your responsible team verifies completeness and decides
                      what action to take. Save a drill snapshot and export the
                      full evidence packet.
                    </p>
                  </div>
                </div>
                <div className="notice">
                  <TriangleAlert size={22} />
                  <p>
                    Lotline does not decide food safety, recall necessity, or
                    legal compliance. An empty result is not proof of no
                    exposure. This version supports one transformation layer:
                    ingredient lot → finished batch → shipment. Rework, blended
                    intermediates, returns, and waste require additional
                    verified records and review.
                  </p>
                </div>
                <p className="fineprint">
                  CFIA describes one-step-back / one-step-forward traceability
                  and requests for accessible records. Applicability varies by
                  business.{" "}
                  <a
                    href="https://inspection.canada.ca/en/food-safety-industry/traceability/traceability"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the official guidance ↗
                  </a>
                </p>
                <button className="btn" onClick={setDemo}>
                  Explore the synthetic sample
                </button>
              </>
            )}
          </section>
        </div>
      )}
      <section className="print-report">
        <div className="print-brand">lotline.</div>
        <h1>Recall rehearsal · {lot}</h1>
        <p>
          {name} · Generated {reportTime} ·{" "}
          {active
            ? "Saved workspace"
            : isSample
              ? "Synthetic sample workspace"
              : "Unsaved workspace"}
        </p>
        <p>
          Record-based preparation report. Does not establish food safety, legal
          compliance, or dataset completeness.
        </p>
        <h2>Recorded scope</h2>
        <p>
          {result.batches.length} batches · {result.customers.length} customers
          ·{" "}
          {result.outputQuantityComplete
            ? `${n(result.affectedShippedQuantity)} ${result.affectedUnit} shipped`
            : "Shipped total unavailable: review units"}{" "}
          ·{" "}
          {result.outputQuantityComplete
            ? `${n(result.affectedOnHandQuantity)} ${result.affectedUnit} calculated balance`
            : "Balance unavailable: review units / output"}
        </p>
        <h2>Confirmed distribution</h2>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Batch</th>
              <th>Quantity</th>
              <th>Source</th>
              <th>Verified correction</th>
            </tr>
          </thead>
          <tbody>
            {result.batches.flatMap((b) =>
              b.shipments.map((s) => (
                <tr key={s.id}>
                  <td>{s.customer}</td>
                  <td>{s.batch}</td>
                  <td>
                    {s.quantity} {s.unit}
                  </td>
                  <td>
                    {s.source}:{s.row}
                  </td>
                  <td>
                    {s.originalBatch !== undefined
                      ? `Original batch: ${s.originalBatch || "(blank)"}. ${s.correctionNote} (${s.correctedAt})`
                      : "None"}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
        <h2>Unresolved shipments — included for review</h2>
        {result.uncertainShipments.map((s) => (
          <p key={s.id}>
            {s.customer} · {s.quantity} {s.unit} · {s.source}:{s.row} · batch{" "}
            {s.batch || "missing"}
          </p>
        ))}
        <h2>Findings</h2>
        {result.issues.map((i) => (
          <p key={i.id}>
            <strong>{i.title}:</strong> {i.detail} {i.source}:{i.row}
          </p>
        ))}
        <h2>Receiving evidence</h2>
        {result.receipts.map((r) => (
          <p key={r.id}>
            {r.lot} · {r.ingredient} · {r.supplier} · {r.quantity} {r.unit} ·{" "}
            {r.receivedDate} · {r.source}:{r.row}
          </p>
        ))}
        <h2>Production evidence</h2>
        {result.batches.map((b) => (
          <div key={b.batch}>
            <h3>
              {b.batch} · {b.product}
            </h3>
            <p>
              {result.inputQuantityComplete
                ? `${b.usedQuantity} ${b.unit} input`
                : "Input requires review"}{" "}
              ·{" "}
              {b.balanceKnown
                ? `${b.outputQuantity} ${b.outputUnit} output`
                : "Output / balance requires review"}
            </p>
            {b.evidence.map((e) => (
              <p key={e.id}>
                {e.source}:{e.row} · {e.lot} · {e.producedDate}
              </p>
            ))}
          </div>
        ))}
        <h2>Boundaries</h2>
        <p>
          One transformation layer only. Ingredient and finished product
          quantities use separate units. Stock balance excludes unrecorded
          waste, returns, transfers, or rework. Unknown assignments can widen
          scope. Confirm full records with your responsible team before acting.
        </p>
      </section>
    </div>
  );
}
function Metric({
  label,
  value,
  suffix,
  detail,
  icon,
  warning,
}: {
  label: string;
  value: string;
  suffix?: string;
  detail: string;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <article className={"metric " + (warning ? "warning" : "")}>
      <div>
        <span>{label}</span>
        {icon}
      </div>
      <strong>
        {value}
        <small>{suffix}</small>
      </strong>
      <p>{detail}</p>
    </article>
  );
}
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
function ModalHeader({ title, close }: { title: string; close: () => void }) {
  return (
    <div className="modal-header">
      <h2>{title}</h2>
      <button className="iconbtn" aria-label="Close dialog" onClick={close}>
        <X size={21} />
      </button>
    </div>
  );
}
