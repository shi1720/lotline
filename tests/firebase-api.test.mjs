import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";

const bundlePath = new URL("../work-firebase-api-test.mjs", import.meta.url);
const built = await build({
  entryPoints: ["server/app.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  write: false,
});
await writeFile(bundlePath, built.outputFiles[0].text);
const { createApp } = await import(bundlePath.href);
await rm(bundlePath);

// Transactional adapter exercises real HTTP handlers, schema parsing, auth, quotas,
// ownership and immutable snapshots. Commits are serialized to model conflicts.
function database() {
  const rows = new Map();
  let pending = Promise.resolve();
  const snapshot = (path) => ({
    exists: rows.has(path),
    id: path.split("/").at(-1),
    data: () => structuredClone(rows.get(path)),
  });
  const query = (path, sort, max) => ({
    path,
    sort,
    max,
    orderBy(field, direction) {
      return query(path, [field, direction], max);
    },
    limit(n) {
      return query(path, sort, n);
    },
    async get() {
      let entries = [...rows].filter(
        ([key]) =>
          key.startsWith(path + "/") &&
          key.split("/").length === path.split("/").length + 1,
      );
      if (sort)
        entries.sort(
          (a, b) =>
            String(a[1][sort[0]]).localeCompare(String(b[1][sort[0]])) *
            (sort[1] === "desc" ? -1 : 1),
        );
      if (max) entries = entries.slice(0, max);
      return { docs: entries.map(([key]) => snapshot(key)) };
    },
    doc(id) {
      return ref(path + "/" + id);
    },
  });
  const ref = (path) => ({
    path,
    id: path.split("/").at(-1),
    get: async () => snapshot(path),
    collection: (id) => query(path + "/" + id),
  });
  return {
    rows,
    doc: ref,
    async recursiveDelete(reference) {
      for (const key of rows.keys())
        if (key === reference.path || key.startsWith(reference.path + "/"))
          rows.delete(key);
    },
    runTransaction(fn) {
      const run = pending.then(async () => {
        const writes = [];
        const tx = {
          get: (reference) => reference.get(),
          set(reference, value, options) {
            writes.push(() =>
              rows.set(
                reference.path,
                structuredClone(
                  options?.merge
                    ? { ...rows.get(reference.path), ...value }
                    : value,
                ),
              ),
            );
          },
          update(reference, value) {
            this.set(reference, value, { merge: true });
          },
        };
        const result = await fn(tx);
        writes.forEach((write) => write());
        return result;
      });
      pending = run.catch(() => {});
      return run;
    },
  };
}
const origin = "https://lotline-recall.web.app";
const empty = { receipts: [], production: [], shipments: [] };
const sample = {
  receipts: [
    {
      id: "r1",
      source: "receipts.csv",
      row: 2,
      ingredient: "Oats",
      lot: "LOT-1",
      supplier: "North",
      receivedDate: "2026-10-01",
      quantity: 100,
      unit: "kg",
    },
  ],
  production: [
    {
      id: "p1",
      source: "production.csv",
      row: 2,
      batch: "BATCH-1",
      product: "Granola",
      ingredient: "Oats",
      lot: "LOT-1",
      quantity: 10,
      unit: "kg",
      producedDate: "2026-10-02",
      outputQuantity: 50,
      outputUnit: "case",
    },
  ],
  shipments: [
    {
      id: "s1",
      source: "shipments.csv",
      row: 2,
      batch: "BATCH-1",
      product: "Granola",
      customer: "Market",
      email: "market@example.com",
      quantity: 20,
      unit: "case",
      shippedDate: "2026-10-03",
    },
  ],
};
async function fixture() {
  const db = database(),
    verification = [];
  const app = createApp({
    db,
    auth: {
      async verifyIdToken(token, checkRevoked) {
        verification.push(checkRevoked);
        if (!["alice", "bob"].includes(token)) throw Error("invalid");
        return { uid: token };
      },
    },
    allowedOrigins: [origin],
  });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const request = async (
    path,
    {
      method = "GET",
      data,
      token = "alice",
      requestOrigin = origin,
      headers = {},
    } = {},
  ) => {
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api${path}`,
      {
        method,
        headers: {
          ...(token ? { Authorization: "Bearer " + token } : {}),
          ...(requestOrigin ? { Origin: requestOrigin } : {}),
          ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(data !== undefined
          ? { body: typeof data === "string" ? data : JSON.stringify(data) }
          : {}),
      },
    );
    return {
      status: response.status,
      body: await response.json(),
      headers: response.headers,
    };
  };
  return {
    db,
    verification,
    request,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
test("Firebase API rejects unauthenticated, revoked, wrong origin, malformed and oversized requests", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request("/health", { token: null })).status, 200);
    assert.equal((await f.request("/workspaces", { token: null })).status, 401);
    assert.equal(
      (await f.request("/workspaces", { token: "revoked" })).status,
      401,
    );
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: { name: "Test", dataset: empty },
          requestOrigin: "https://attacker.example",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: { name: "Test", dataset: empty },
          requestOrigin: null,
        })
      ).status,
      403,
    );
    assert.equal(
      (await f.request("/workspaces", { method: "POST", data: "{" })).status,
      400,
    );
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: " ".repeat(1_048_577),
        })
      ).status,
      413,
    );
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: { name: "Test", dataset: empty, owner: "bob" },
        })
      ).status,
      400,
    );
    assert.ok(f.verification.every(Boolean));
  } finally {
    await f.close();
  }
});
test("full private workflow saves source evidence, creates immutable snapshots, audits revisions and cascades deletion", async () => {
  const f = await fixture();
  try {
    const created = await f.request("/workspaces", {
      method: "POST",
      data: { name: "  Oat producer  ", dataset: sample },
    });
    assert.equal(created.status, 201);
    const id = created.body.workspace.id;
    assert.equal(created.body.workspace.name, "Oat producer");
    assert.equal(
      (await f.request(`/workspaces/${id}`, { token: "bob" })).status,
      404,
    );
    assert.equal(
      (await f.request(`/workspaces/${id}/events`, { token: "bob" })).status,
      404,
    );
    assert.equal(
      (await f.request(`/workspaces/${id}/drills`, { token: "bob" })).status,
      404,
    );
    const saved = await f.request(`/workspaces/${id}/drills`, {
      method: "POST",
      data: { lot: "LOT-1", notes: "Reviewer verified source rows." },
    });
    assert.equal(saved.status, 201);
    assert.deepEqual(saved.body.drill.dataset, sample);
    assert.ok(saved.body.drill.result);
    const update = await f.request(`/workspaces/${id}`, {
      method: "PUT",
      data: {
        dataset: empty,
        revision: 1,
        revisionNote: "Confirmed source replacement.",
      },
    });
    assert.equal(update.status, 200);
    assert.equal(update.body.workspace.revision, 2);
    assert.equal(
      (
        await f.request(`/workspaces/${id}`, {
          method: "PUT",
          data: { dataset: sample, revision: 1 },
        })
      ).status,
      409,
    );
    const snapshot = await f.request(
      `/workspaces/${id}/drills/${saved.body.drill.id}`,
    );
    assert.equal(snapshot.status, 200);
    assert.deepEqual(snapshot.body.drill.dataset, sample);
    assert.equal(snapshot.body.drill.revision, 1);
    assert.equal(
      (
        await f.request(`/workspaces/${id}/drills/${saved.body.drill.id}`, {
          token: "bob",
        })
      ).status,
      404,
    );
    const note = await f.request(`/workspaces/${id}/events`, {
      method: "POST",
      data: { action: "Reviewed", detail: "Evidence confirmed" },
    });
    assert.equal(note.body.event.kind, "note");
    assert.match(note.body.event.action, /^User note:/);
    const events = await f.request(`/workspaces/${id}/events`);
    assert.equal(
      events.body.events.filter((e) => e.kind === "system").length,
      3,
    );
    assert.ok(
      events.body.events.some((e) =>
        e.detail.includes("Confirmed source replacement."),
      ),
    );
    assert.ok(f.db.rows.get("users/alice").storageBytes > 0);
    assert.equal(
      (await f.request(`/workspaces/${id}`, { method: "DELETE" })).status,
      200,
    );
    assert.equal((await f.request(`/workspaces/${id}`)).status, 404);
    assert.equal(f.db.rows.get("users/alice").storageBytes, 0);
    assert.equal(f.db.rows.get("users/alice").workspaceCount, 0);
    assert.ok(
      ![...f.db.rows.keys()].some((k) =>
        k.startsWith(`users/alice/workspaces/${id}`),
      ),
    );
  } finally {
    await f.close();
  }
});
test("concurrent saves cannot overwrite revisions and concurrent creates enforce account quota", async () => {
  const f = await fixture();
  try {
    const created = await f.request("/workspaces", {
      method: "POST",
      data: { name: "Test", dataset: empty },
    });
    const path = "/workspaces/" + created.body.workspace.id;
    const saved = await Promise.all(
      [1, 2].map(() =>
        f.request(path, {
          method: "PUT",
          data: { dataset: empty, revision: 1 },
        }),
      ),
    );
    assert.deepEqual(saved.map((v) => v.status).sort(), [200, 409]);
    f.db.rows.set("users/alice", { storageBytes: 0, workspaceCount: 19 });
    const createdBoth = await Promise.all(
      [1, 2].map(() =>
        f.request("/workspaces", {
          method: "POST",
          data: { name: "Quota", dataset: empty },
        }),
      ),
    );
    assert.deepEqual(createdBoth.map((v) => v.status).sort(), [201, 409]);
    f.db.rows.set("users/alice", {
      storageBytes: 25 * 1024 * 1024,
      workspaceCount: 1,
    });
    assert.equal(
      (
        await f.request(path + "/drills", {
          method: "POST",
          data: { lot: "L" },
        })
      ).status,
      409,
    );
  } finally {
    await f.close();
  }
});
test("rule mapping is truthful, validates headers and never claims a model executed", async () => {
  const f = await fixture();
  try {
    const response = await f.request("/map", {
      method: "POST",
      data: { kind: "receipts", headers: ["Lot", "Supplier", "Quantity"] },
    });
    assert.equal(response.status, 200);
    assert.equal(response.body.mode, "rules");
    assert.equal(response.body.mapping.lot, "Lot");
    assert.equal(
      (
        await f.request("/map", {
          method: "POST",
          data: { kind: "receipts", headers: ["Lot", "Lot"] },
        })
      ).status,
      400,
    );
    assert.equal(response.headers.get("cache-control"), "no-store, private");
  } finally {
    await f.close();
  }
});
test("limits reject oversized datasets, snapshot overflow, invalid dates and note impersonation", async () => {
  const f = await fixture();
  try {
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: {
            name: "Invalid",
            dataset: {
              ...sample,
              receipts: [{ ...sample.receipts[0], receivedDate: "2026-02-30" }],
            },
          },
        })
      ).status,
      400,
    );
    const rows = Array.from({ length: 200 }, (_, i) => ({
      ...sample.receipts[0],
      id: "r" + i,
      sourceData: { large: "x".repeat(2000), large2: "y".repeat(2000) },
    }));
    assert.equal(
      (
        await f.request("/workspaces", {
          method: "POST",
          data: { name: "Too large", dataset: { ...empty, receipts: rows } },
        })
      ).status,
      413,
    );
    const created = await f.request("/workspaces", {
        method: "POST",
        data: { name: "Test", dataset: sample },
      }),
      path = "/workspaces/" + created.body.workspace.id;
    assert.equal(
      (
        await f.request(path + "/events", {
          method: "POST",
          data: { action: "Verified", detail: "x", kind: "system" },
        })
      ).status,
      400,
    );
    const ref = "users/alice" + path;
    const record = f.db.rows.get(ref);
    f.db.rows.set(ref, { ...record, noteCount: 500 });
    assert.equal(
      (
        await f.request(path + "/events", {
          method: "POST",
          data: { action: "Reviewed", detail: "x" },
        })
      ).status,
      409,
    );
    f.db.rows.set(ref, { ...record, drillCount: 100 });
    assert.equal(
      (
        await f.request(path + "/drills", {
          method: "POST",
          data: { lot: "LOT-1" },
        })
      ).status,
      409,
    );
  } finally {
    await f.close();
  }
});
test("large Unicode evidence snapshots cross Firestore document limits and reassemble without data loss", async () => {
  const f = await fixture();
  try {
    const receipts = Array.from({ length: 140 }, (_, i) => ({
      ...sample.receipts[0],
      id: "row-" + i,
      row: i + 2,
      quantity: 100 + i,
      sourceData: { evidence: "é".repeat(1800) },
    }));
    const dataset = { ...sample, receipts };
    const create = await f.request("/workspaces", {
      method: "POST",
      data: {
        name: "Unicode evidence",
        dataset,
        revisionNote: "Reviewed before initial save.",
      },
    });
    assert.equal(create.status, 201);
    const path = "/workspaces/" + create.body.workspace.id;
    const saved = await f.request(path + "/drills", {
      method: "POST",
      data: { lot: "LOT-1" },
    });
    assert.equal(saved.status, 201);
    const snapshotPath =
      "users/alice" + path + "/drills/" + saved.body.drill.id;
    const metadata = f.db.rows.get(snapshotPath);
    assert.ok(metadata.chunks >= 4);
    for (const [key, value] of f.db.rows)
      if (key.startsWith(snapshotPath + "/chunks/"))
        assert.ok(Buffer.byteLength(JSON.stringify(value)) < 1_000_000);
    const loaded = await f.request(path + "/drills/" + saved.body.drill.id);
    assert.equal(loaded.status, 200);
    assert.deepEqual(loaded.body.drill.dataset, dataset);
    assert.deepEqual(loaded.body.drill.result, saved.body.drill.result);
    assert.ok(
      (await f.request(path + "/events")).body.events.some((e) =>
        e.detail.includes("Reviewed before initial save."),
      ),
    );
  } finally {
    await f.close();
  }
});
test("failed deletion is explicit and repeat DELETE completes partial cleanup without freeing quota twice", async () => {
  const f = await fixture();
  try {
    const created = await f.request("/workspaces", {
        method: "POST",
        data: { name: "Delete recovery", dataset: sample },
      }),
      id = created.body.workspace.id,
      path = "/workspaces/" + id;
    await f.request(path + "/drills", {
      method: "POST",
      data: { lot: "LOT-1" },
    });
    const originalDelete = f.db.recursiveDelete.bind(f.db);
    let failures = 3,
      attempts = 0;
    f.db.recursiveDelete = async (ref) => {
      if (ref.path.includes("/workspaces/")) {
        attempts++;
        if (failures-- > 0) {
          f.db.rows.delete(ref.path);
          throw new Error("simulated partial deletion");
        }
      }
      return originalDelete(ref);
    };
    const failed = await f.request(path, { method: "DELETE" });
    assert.equal(failed.status, 503);
    assert.match(failed.body.error, /pending/);
    assert.equal(attempts, 3);
    assert.equal((await f.request(path)).status, 404);
    assert.equal((await f.request(path + "/drills")).status, 404);
    assert.equal(f.db.rows.get("users/alice").workspaceCount, 0);
    assert.equal(f.db.rows.get("users/alice").storageBytes, 0);
    assert.ok(f.db.rows.has("users/alice/deletions/" + id));
    // Another saved workspace must retain its quota when deletion is retried.
    await f.request("/workspaces", {
      method: "POST",
      data: { name: "Keep", dataset: sample },
    });
    const usage = { ...f.db.rows.get("users/alice") };
    const recovered = await f.request(path, { method: "DELETE" });
    assert.equal(recovered.status, 200);
    assert.deepEqual(f.db.rows.get("users/alice"), usage);
    assert.ok(!f.db.rows.has("users/alice/deletions/" + id));
    assert.ok(
      ![...f.db.rows.keys()].some((k) => k.startsWith("users/alice" + path)),
    );
  } finally {
    await f.close();
  }
});
test("per-user burst limits protect reads and writes, return Retry-After, and exempt public health", async () => {
  const f = await fixture();
  try {
    for (let i = 0; i < 120; i++)
      assert.equal((await f.request("/workspaces")).status, 200);
    const limited = await f.request("/workspaces");
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers.get("retry-after")) >= 1);
    assert.match(limited.body.error, /wait/);
    assert.equal((await f.request("/health", { token: null })).status, 200);
    assert.equal(
      (await f.request("/workspaces", { token: "bob" })).status,
      200,
    );
    for (let i = 0; i < 30; i++)
      assert.equal(
        (
          await f.request("/map", {
            token: "bob",
            method: "POST",
            data: { kind: "receipts", headers: ["Lot"] },
          })
        ).status,
        200,
      );
    assert.equal(
      (
        await f.request("/map", {
          token: "bob",
          method: "POST",
          data: { kind: "receipts", headers: ["Lot"] },
        })
      ).status,
      429,
    );
    assert.equal(
      (await f.request("/workspaces", { token: "bob" })).status,
      200,
    );
  } finally {
    await f.close();
  }
});
