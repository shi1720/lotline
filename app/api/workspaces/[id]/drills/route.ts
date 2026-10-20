import { authenticated, body, database, json, route, ApiError, ownedWorkspace, type IdContext } from "@/lib/server-http";
import { drillSchema } from "@/lib/server-validation";
import { analyze, type Dataset } from "@/lib/trace";
type DrillRow = { id: string; lot: string; notes: string; result: string; dataset: string; revision: number; created_at: string };
function publicDrill(row: DrillRow) { return { id: row.id, lot: row.lot, notes: row.notes, result: JSON.parse(row.result), dataset: JSON.parse(row.dataset), revision: row.revision, createdAt: row.created_at }; }
export const GET = route(async (_request: Request, context: IdContext) => {
  const userId = await authenticated(), { id } = await context.params, db = database(); await ownedWorkspace(db, id, userId);
  // A 100-snapshot workspace can contain 100 MB; list metadata only. A single snapshot has its own read endpoint.
  const { results } = await db.prepare("SELECT id, lot, notes, revision, created_at FROM drills WHERE workspace_id = ? ORDER BY created_at DESC, id DESC LIMIT 100").bind(id).all<Omit<DrillRow, "dataset" | "result">>();
  return json({ drills: results.map(row => ({id: row.id, lot: row.lot, notes: row.notes, revision: row.revision, createdAt: row.created_at})) });
});
export const POST = route(async (request: Request, context: IdContext) => {
  const userId = await authenticated(), input = await body(request, drillSchema), { id } = await context.params, db = database();
  const workspace = await ownedWorkspace(db, id, userId), dataset = JSON.parse(workspace.dataset) as Dataset;
  const result = analyze(dataset, input.lot);
  const serializedResult = JSON.stringify(result);
  if (new TextEncoder().encode(serializedResult + workspace.dataset).byteLength > 1_800_000) throw new ApiError(413, "This snapshot exceeds the storage row limit. Split the workspace into smaller record sets before saving a drill.");
  const drill = await db.prepare("INSERT INTO drills (id, workspace_id, lot, notes, result, dataset, revision, created_at) SELECT ?, id, ?, ?, ?, dataset, revision, ? FROM workspaces WHERE id = ? AND user_id = ? AND revision = ? AND (SELECT COUNT(*) FROM drills WHERE workspace_id = ?) < 100 RETURNING *")
    .bind(crypto.randomUUID(), input.lot.trim(), input.notes, serializedResult, new Date().toISOString(), id, userId, workspace.revision, id).first<DrillRow>();
  if (!drill) throw new ApiError(409, "Snapshot limit reached (100), or records changed during the drill. Reload before retrying.");
  return json({ drill: publicDrill(drill) }, 201);
});
