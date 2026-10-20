import { authenticated, body, database, json, route, ApiError, publicWorkspace, type WorkspaceRow } from "@/lib/server-http";
import { createWorkspaceSchema } from "@/lib/server-validation";

export const GET = route(async () => {
  const userId = await authenticated(); const db = database();
  const { results } = await db.prepare("SELECT * FROM workspaces WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 20").bind(userId).all<WorkspaceRow>();
  return json({ workspaces: results.map(publicWorkspace) });
});
export const POST = route(async (request: Request) => {
  const userId = await authenticated(); const input = await body(request, createWorkspaceSchema); const db = database();
  const id = crypto.randomUUID(), now = new Date().toISOString();
  const row = await db.prepare("INSERT INTO workspaces (id, user_id, name, dataset, revision, created_at, updated_at) SELECT ?, ?, ?, ?, 1, ?, ? WHERE (SELECT COUNT(*) FROM workspaces WHERE user_id = ?) < 20 RETURNING *")
    .bind(id, userId, input.name.trim(), JSON.stringify(input.dataset), now, now, userId).first<WorkspaceRow>();
  if (!row) throw new ApiError(409, "Workspace limit reached (20). Delete a workspace before adding another.");
  return json({ workspace: publicWorkspace(row) }, 201);
});
