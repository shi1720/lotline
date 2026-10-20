import { authenticated, body, database, json, route, ApiError, ownedWorkspace, type IdContext } from "@/lib/server-http";
import { eventSchema } from "@/lib/server-validation";
type EventRow = { id: string; action: string; detail: string; kind: string; revision: number; created_at: string };
function publicEvent(row: EventRow) { return {id: row.id, action: row.action, detail: row.detail, kind: row.kind, revision: row.revision, createdAt: row.created_at}; }
export const GET = route(async (_request: Request, context: IdContext) => {
  const userId = await authenticated(), { id } = await context.params, db = database(); await ownedWorkspace(db, id, userId);
  const { results } = await db.prepare("SELECT * FROM events WHERE workspace_id = ? ORDER BY created_at DESC, id DESC LIMIT 200").bind(id).all<EventRow>();
  return json({ events: results.map(publicEvent) });
});
export const POST = route(async (request: Request, context: IdContext) => {
  const userId = await authenticated(), input = await body(request, eventSchema), { id } = await context.params, db = database();
  await ownedWorkspace(db, id, userId);
  // User-authored notes are explicitly distinct from server-verified audit events.
  const event = await db.prepare("INSERT INTO events (id, workspace_id, action, detail, kind, revision, created_at) SELECT ?, id, ?, ?, 'note', revision, ? FROM workspaces WHERE id = ? AND user_id = ? AND (SELECT COUNT(*) FROM events WHERE workspace_id = ? AND kind = 'note') < 500 RETURNING *")
    .bind(crypto.randomUUID(), `User note: ${input.action}`, input.detail, new Date().toISOString(), id, userId, id).first<EventRow>();
  if (!event) throw new ApiError(409, "Note limit reached or workspace changed. Reload to continue.");
  return json({ event: publicEvent(event) }, 201);
});
