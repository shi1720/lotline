import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import type { Auth } from "firebase-admin/auth";
import type {
  Firestore,
  Transaction,
  DocumentReference,
} from "firebase-admin/firestore";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  eventSchema,
  drillSchema,
  mapSchema,
  multilineNote,
} from "../lib/server-validation";
import { analyze, type Dataset } from "../lib/trace";
import { defaultMapping } from "../lib/import";

const MAX_STORAGE = 25 * 1024 * 1024;
const MAX_DATASET = 700_000;
const MAX_SNAPSHOT = 1_800_000;
const bytes = (value: unknown) =>
  Buffer.byteLength(typeof value === "string" ? value : JSON.stringify(value));
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
type Workspace = {
  id: string;
  name: string;
  dataset: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  storageBytes: number;
  drillCount: number;
  noteCount: number;
  eventCount: number;
  deleting?: boolean;
};
type Account = { storageBytes: number; workspaceCount: number };
export type AppOptions = {
  auth: Pick<Auth, "verifyIdToken">;
  db: Firestore;
  allowedOrigins: string[];
  development?: boolean;
  now?: () => string;
};
const publicWorkspace = (row: Workspace) => ({
  id: row.id,
  name: row.name,
  dataset: JSON.parse(row.dataset),
  revision: row.revision,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
function validId(id: string) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id))
    throw new ApiError(404, "Workspace not found.");
  return id;
}
function existing(snapshot: { exists: boolean; data(): unknown }): Workspace {
  const row = snapshot.data() as Workspace;
  if (!snapshot.exists || row.deleting)
    throw new ApiError(404, "Workspace not found.");
  return row;
}
function datasetJson(dataset: Dataset) {
  const value = JSON.stringify(dataset);
  if (bytes(value) > MAX_DATASET)
    throw new ApiError(
      413,
      "This workspace exceeds the 700 KB record limit. Split the records into smaller workspaces.",
    );
  return value;
}
function quota(account: Account, delta: number) {
  if (account.storageBytes + delta > MAX_STORAGE)
    throw new ApiError(
      409,
      "Account storage limit (25 MiB) reached. Delete a workspace to free storage.",
    );
}
export function createApp({
  auth,
  db,
  allowedOrigins,
  development = false,
  now = () => new Date().toISOString(),
}: AppOptions) {
  const app = express();
  // A per-process guard complements durable storage quotas. Cloud Run starts at
  // one instance; this is deliberately not advertised as a distributed limiter.
  const requestWindows = new Map<
    string,
    { reset: number; total: number; writes: number }
  >();
  function throttle(uid: string, mutation: boolean, res: Response) {
    const timestamp = Date.now();
    let window = requestWindows.get(uid);
    if (!window || window.reset <= timestamp) {
      if (requestWindows.size >= 10_000) {
        for (const [key, entry] of requestWindows)
          if (entry.reset <= timestamp) requestWindows.delete(key);
        if (requestWindows.size >= 10_000)
          requestWindows.delete(requestWindows.keys().next().value!);
      }
      window = { reset: timestamp + 60_000, total: 0, writes: 0 };
      requestWindows.set(uid, window);
    }
    if (window.total >= 120 || (mutation && window.writes >= 30)) {
      res.set(
        "Retry-After",
        String(Math.max(1, Math.ceil((window.reset - timestamp) / 1000))),
      );
      throw new ApiError(
        429,
        "Request limit reached. Please wait a minute before trying again.",
      );
    }
    window.total++;
    if (mutation) window.writes++;
  }
  app.disable("x-powered-by");
  app.use("/api", (_req, res, next) => {
    res.set({
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      Vary: "Authorization, Origin",
    });
    next();
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", version: "1.0.0" });
  });
  app.use("/api", async (req, res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/.exec(req.get("Authorization") || "");
      if (!match)
        throw new ApiError(401, "Sign in to access your private workspaces.");
      try {
        const token = await auth.verifyIdToken(match[1], true);
        res.locals.uid = token.uid;
      } catch {
        throw new ApiError(401, "Your session has expired. Sign in again.");
      }
      const mutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
      throttle(res.locals.uid, mutation, res);
      if (mutation) {
        const origin = req.get("Origin");
        const local =
          development &&
          origin &&
          /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        if (!origin || (!allowedOrigins.includes(origin) && !local))
          throw new ApiError(403, "A same-origin request is required.");
        if (req.get("Sec-Fetch-Site") === "cross-site")
          throw new ApiError(403, "Cross-site requests are not allowed.");
        if (req.method !== "DELETE" && !req.is("application/json"))
          throw new ApiError(415, "Send application/json.");
      }
      next();
    } catch (error) {
      next(error);
    }
  });
  app.use("/api", express.json({ limit: "1mb", strict: true }));
  const accountRef = (uid: string) => db.doc(`users/${uid}`);
  const workspaceRef = (uid: string, id: string) =>
    accountRef(uid).collection("workspaces").doc(validId(id));
  const getAccount = async (tx: Transaction, ref: DocumentReference) =>
    ((await tx.get(ref)).data() as Account) || {
      storageBytes: 0,
      workspaceCount: 0,
    };
  function audit(
    tx: Transaction,
    ref: DocumentReference,
    row: Workspace,
    action: string,
    detail: string,
  ) {
    if (row.eventCount >= 5000)
      throw new ApiError(
        409,
        "This workspace has reached its audit history limit. Create a new workspace to continue.",
      );
    const event = {
      id: randomUUID(),
      action,
      detail,
      kind: "system",
      revision: row.revision,
      createdAt: now(),
    };
    tx.set(ref.collection("events").doc(event.id), event);
    row.eventCount++;
    row.storageBytes += bytes(event);
    return bytes(event);
  }
  app.get("/api/workspaces", async (_req, res, next) => {
    try {
      const snapshot = await accountRef(res.locals.uid)
        .collection("workspaces")
        .get();
      const rows = snapshot.docs
        .map((d) => d.data() as Workspace)
        .filter((r) => !r.deleting)
        .sort(
          (a, b) =>
            b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id),
        );
      res.json({ workspaces: rows.map(publicWorkspace) });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/workspaces", async (req, res, next) => {
    try {
      const input = createWorkspaceSchema
          .extend({ revisionNote: multilineNote(1000).optional() })
          .parse(req.body),
        serialized = datasetJson(input.dataset),
        ref = workspaceRef(res.locals.uid, randomUUID()),
        account = accountRef(res.locals.uid),
        timestamp = now();
      const row: Workspace = {
        id: ref.id,
        name: input.name.trim(),
        dataset: serialized,
        revision: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        storageBytes: bytes(serialized),
        drillCount: 0,
        noteCount: 0,
        eventCount: 0,
      };
      await db.runTransaction(async (tx) => {
        const usage = await getAccount(tx, account);
        if (usage.workspaceCount >= 20)
          throw new ApiError(
            409,
            "Workspace limit (20) reached. Delete a workspace before adding another.",
          );
        row.eventCount = 0;
        row.storageBytes = bytes(serialized);
        audit(
          tx,
          ref,
          row,
          "Workspace created",
          `Saved source records as revision 1.${input.revisionNote ? ` Reviewer note: ${input.revisionNote}` : ""}`,
        );
        quota(usage, row.storageBytes);
        tx.set(ref, row);
        tx.set(
          account,
          {
            storageBytes: usage.storageBytes + row.storageBytes,
            workspaceCount: usage.workspaceCount + 1,
          },
          { merge: true },
        );
      });
      res.status(201).json({ workspace: publicWorkspace(row) });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/workspaces/:id", async (req, res, next) => {
    try {
      res.json({
        workspace: publicWorkspace(
          existing(await workspaceRef(res.locals.uid, req.params.id).get()),
        ),
      });
    } catch (e) {
      next(e);
    }
  });
  app.put("/api/workspaces/:id", async (req, res, next) => {
    try {
      const input = updateWorkspaceSchema
          .extend({ revisionNote: multilineNote(1000).optional() })
          .parse(req.body),
        serialized = datasetJson(input.dataset),
        ref = workspaceRef(res.locals.uid, req.params.id),
        account = accountRef(res.locals.uid);
      const row = await db.runTransaction(async (tx) => {
        const current = existing(await tx.get(ref)),
          usage = await getAccount(tx, account);
        if (current.revision !== input.revision)
          throw new ApiError(
            409,
            "This workspace changed in another session. Reload before saving to avoid overwriting newer records.",
          );
        const delta = bytes(serialized) - bytes(current.dataset);
        quota(usage, delta);
        const updated = {
          ...current,
          name: input.name?.trim() ?? current.name,
          dataset: serialized,
          revision: current.revision + 1,
          updatedAt: now(),
          storageBytes: current.storageBytes + delta,
        };
        audit(
          tx,
          ref,
          updated,
          "Workspace saved",
          `Saved source records as revision ${updated.revision}.${input.revisionNote ? ` Reviewer note: ${input.revisionNote}` : ""}`,
        );
        const totalDelta = updated.storageBytes - current.storageBytes;
        quota(usage, totalDelta);
        tx.set(ref, updated);
        tx.set(
          account,
          { storageBytes: usage.storageBytes + totalDelta },
          { merge: true },
        );
        return updated;
      });
      res.json({ workspace: publicWorkspace(row) });
    } catch (e) {
      next(e);
    }
  });
  app.delete("/api/workspaces/:id", async (req, res, next) => {
    try {
      const ref = workspaceRef(res.locals.uid, req.params.id),
        account = accountRef(res.locals.uid);
      const cleanupRef = account.collection("deletions").doc(ref.id);
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref),
          usage = await getAccount(tx, account),
          cleanup = await tx.get(cleanupRef);
        if (!snapshot.exists && !cleanup.exists)
          throw new ApiError(404, "Workspace not found.");
        const row = snapshot.data() as Workspace | undefined;
        if (row && !row.deleting) {
          tx.update(ref, { deleting: true });
          tx.set(
            account,
            {
              storageBytes: Math.max(0, usage.storageBytes - row.storageBytes),
              workspaceCount: Math.max(0, usage.workspaceCount - 1),
            },
            { merge: true },
          );
        }
        // This intent survives even if recursiveDelete removes the parent before
        // a descendant fails. A repeated DELETE can safely finish the cleanup.
        if (!cleanup.exists)
          tx.set(cleanupRef, { workspaceId: ref.id, createdAt: now() });
      });
      // Tombstones deny reads and writes immediately. Quota is released once.
      let removed = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await db.recursiveDelete(ref);
          removed = true;
          break;
        } catch {
          /* The Admin SDK already retries individual transient writes. */
        }
      }
      if (!removed)
        throw new ApiError(
          503,
          "This workspace is inaccessible while deletion cleanup is pending. Retry deleting it to finish removing the stored records.",
        );
      try {
        await db.recursiveDelete(cleanupRef);
      } catch {
        throw new ApiError(
          503,
          "Records were removed but deletion bookkeeping is pending. Retry deleting this workspace to complete cleanup.",
        );
      }
      res.json({ deleted: true });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/workspaces/:id/events", async (req, res, next) => {
    try {
      const ref = workspaceRef(res.locals.uid, req.params.id);
      const events = await db.runTransaction(async (tx) => {
        existing(await tx.get(ref));
        const result = await tx.get(
          ref.collection("events").orderBy("createdAt", "desc").limit(200),
        );
        return result.docs.map((d) => d.data());
      });
      res.json({ events });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/workspaces/:id/events", async (req, res, next) => {
    try {
      const input = eventSchema.parse(req.body),
        ref = workspaceRef(res.locals.uid, req.params.id),
        account = accountRef(res.locals.uid);
      const event = await db.runTransaction(async (tx) => {
        const row = existing(await tx.get(ref)),
          usage = await getAccount(tx, account);
        if (row.noteCount >= 500)
          throw new ApiError(
            409,
            "Note limit (500) reached for this workspace.",
          );
        const value = {
          id: randomUUID(),
          action: `User note: ${input.action}`,
          detail: input.detail,
          kind: "note",
          revision: row.revision,
          createdAt: now(),
        };
        const delta = bytes(value);
        quota(usage, delta);
        tx.set(ref.collection("events").doc(value.id), value);
        tx.update(ref, {
          noteCount: row.noteCount + 1,
          storageBytes: row.storageBytes + delta,
        });
        tx.set(
          account,
          { storageBytes: usage.storageBytes + delta },
          { merge: true },
        );
        return value;
      });
      res.status(201).json({ event });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/workspaces/:id/drills", async (req, res, next) => {
    try {
      const ref = workspaceRef(res.locals.uid, req.params.id);
      const drills = await db.runTransaction(async (tx) => {
        existing(await tx.get(ref));
        const result = await tx.get(
          ref.collection("drills").orderBy("createdAt", "desc").limit(100),
        );
        return result.docs.map((d) => {
          const { id, lot, notes, revision, createdAt } = d.data();
          return { id, lot, notes, revision, createdAt };
        });
      });
      res.json({ drills });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/workspaces/:id/drills", async (req, res, next) => {
    try {
      const input = drillSchema.parse(req.body),
        ref = workspaceRef(res.locals.uid, req.params.id),
        account = accountRef(res.locals.uid),
        id = randomUUID();
      const drill = await db.runTransaction(async (tx) => {
        const row = existing(await tx.get(ref)),
          usage = await getAccount(tx, account);
        if (row.drillCount >= 100)
          throw new ApiError(
            409,
            "Snapshot limit (100) reached for this workspace.",
          );
        const dataset = JSON.parse(row.dataset) as Dataset,
          result = analyze(dataset, input.lot.trim());
        const payload = Buffer.from(JSON.stringify({ dataset, result }));
        if (payload.length > MAX_SNAPSHOT)
          throw new ApiError(
            413,
            "This snapshot exceeds the 1.8 MB limit. Split the workspace before saving.",
          );
        const storageBytes = payload.length + bytes(input.notes);
        quota(usage, storageBytes);
        const snapshotRef = ref.collection("drills").doc(id),
          chunks = Math.ceil(payload.length / 300_000),
          metadata = {
            id,
            lot: input.lot.trim(),
            notes: input.notes,
            revision: row.revision,
            createdAt: now(),
            chunks,
            storageBytes,
          };
        tx.set(snapshotRef, metadata);
        for (let i = 0; i < chunks; i++)
          tx.set(snapshotRef.collection("chunks").doc(String(i)), {
            data: payload
              .subarray(i * 300_000, (i + 1) * 300_000)
              .toString("base64"),
          });
        const updated = {
          ...row,
          storageBytes: row.storageBytes + storageBytes,
          drillCount: row.drillCount + 1,
        };
        audit(
          tx,
          ref,
          updated,
          "Drill saved",
          `Saved immutable evidence for lot ${input.lot.trim()} at revision ${row.revision}.`,
        );
        const totalDelta = updated.storageBytes - row.storageBytes;
        quota(usage, totalDelta);
        tx.set(ref, updated);
        tx.set(
          account,
          { storageBytes: usage.storageBytes + totalDelta },
          { merge: true },
        );
        return {
          id,
          lot: metadata.lot,
          notes: metadata.notes,
          revision: row.revision,
          createdAt: metadata.createdAt,
          dataset,
          result,
        };
      });
      res.status(201).json({ drill });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/workspaces/:id/drills/:drillId", async (req, res, next) => {
    try {
      const ref = workspaceRef(res.locals.uid, req.params.id),
        snapshotRef = ref.collection("drills").doc(validId(req.params.drillId));
      const drill = await db.runTransaction(async (tx) => {
        existing(await tx.get(ref));
        const snapshot = await tx.get(snapshotRef);
        if (!snapshot.exists) throw new ApiError(404, "Snapshot not found.");
        const metadata = snapshot.data()!;
        const refs = Array.from({ length: metadata.chunks }, (_, i) =>
          snapshotRef.collection("chunks").doc(String(i)),
        );
        const parts = await Promise.all(refs.map((r) => tx.get(r)));
        if (parts.some((p) => !p.exists))
          throw new ApiError(
            503,
            "Snapshot is temporarily unavailable. Please try again.",
          );
        const payload = JSON.parse(
          Buffer.concat(
            parts.map((p) => Buffer.from(p.data()!.data, "base64")),
          ).toString("utf8"),
        );
        return {
          id: metadata.id,
          lot: metadata.lot,
          notes: metadata.notes,
          revision: metadata.revision,
          createdAt: metadata.createdAt,
          ...payload,
        };
      });
      res.json({ drill });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/map", (req, res, next) => {
    try {
      const input = mapSchema.parse(req.body);
      res.json({
        mapping: defaultMapping(input.kind, input.headers),
        mode: "rules",
        explanation:
          "Rule-based column suggestions. Review every mapping before importing. Source record values are never changed.",
      });
    } catch (e) {
      next(e);
    }
  });
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API endpoint not found." });
  });
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (error instanceof ZodError) {
        res.status(400).json({
          error: "Invalid request",
          issues: error.issues
            .slice(0, 12)
            .map((i) => ({ path: i.path.join("."), message: i.message })),
        });
        return;
      }
      const parseError = error as { type?: string; status?: number };
      if (parseError.type === "entity.too.large") {
        res.status(413).json({ error: "Request exceeds the 1 MB limit." });
        return;
      }
      if (parseError.type === "entity.parse.failed") {
        res.status(400).json({ error: "Malformed JSON body." });
        return;
      }
      console.error(
        "Lotline API request failed",
        error instanceof Error ? error.name : "UnknownError",
      );
      res.status(500).json({
        error: "The request could not be completed. Please try again.",
      });
    },
  );
  return app;
}
