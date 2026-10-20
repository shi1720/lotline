import { authenticated, database, json, route, ApiError, ownedWorkspace } from "@/lib/server-http";
export const GET = route(async (_request: Request, context: {params: Promise<{id: string; drillId: string}>}) => {
  const userId = await authenticated(), {id, drillId} = await context.params, db = database();
  await ownedWorkspace(db, id, userId);
  const row = await db.prepare("SELECT * FROM drills WHERE id = ? AND workspace_id = ?").bind(drillId, id).first<{id: string; lot: string; notes: string; result: string; dataset: string; revision: number; created_at: string}>();
  if (!row) throw new ApiError(404, "Snapshot not found.");
  return json({drill: {id: row.id, lot: row.lot, notes: row.notes, result: JSON.parse(row.result), dataset: JSON.parse(row.dataset), revision: row.revision, createdAt: row.created_at}});
});
