import {
  authenticated,
  body,
  database,
  json,
  route,
  ApiError,
  publicWorkspace,
  MAX_STORAGE_BYTES,
  USER_STORAGE_BYTES_SQL,
  ownedWorkspace,
  verifyMutation,
  type WorkspaceRow,
  type IdContext,
} from "@/lib/server-http";
import { updateWorkspaceSchema } from "@/lib/server-validation";

export const GET = route(async (_request: Request, context: IdContext) => {
  const userId = await authenticated(),
    { id } = await context.params;
  return json({
    workspace: publicWorkspace(await ownedWorkspace(database(), id, userId)),
  });
});
export const PUT = route(async (request: Request, context: IdContext) => {
  const userId = await authenticated(),
    input = await body(request, updateWorkspaceSchema),
    { id } = await context.params,
    db = database();
  const current = await ownedWorkspace(db, id, userId);
  const serializedDataset = JSON.stringify(input.dataset);
  const row = await db
    .prepare(
      `UPDATE workspaces SET name = ?, dataset = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND user_id = ? AND revision = ? AND ${USER_STORAGE_BYTES_SQL} - length(CAST(workspaces.dataset AS BLOB)) + length(CAST(? AS BLOB)) <= ? RETURNING *`,
    )
    .bind(
      input.name?.trim() ?? current.name,
      serializedDataset,
      new Date().toISOString(),
      id,
      userId,
      input.revision,
      userId,
      userId,
      serializedDataset,
      MAX_STORAGE_BYTES,
    )
    .first<WorkspaceRow>();
  if (!row) {
    const latest = await ownedWorkspace(db, id, userId);
    if (latest.revision !== input.revision) throw new ApiError(409, "This workspace changed in another session. Reload it before saving to avoid overwriting newer records.");
    throw new ApiError(409, "Account storage limit (25 MiB) reached. Delete a workspace to free storage, or reduce these records before saving.");
  }
  return json({ workspace: publicWorkspace(row) });
});
export const DELETE = route(async (request: Request, context: IdContext) => {
  const userId = await authenticated();
  verifyMutation(request);
  const { id } = await context.params,
    db = database();
  await ownedWorkspace(db, id, userId);
  // Explicit dependent deletion also works with D1 foreign-key settings disabled in development.
  await db.batch([
    db
      .prepare(
        "DELETE FROM events WHERE workspace_id IN (SELECT id FROM workspaces WHERE id = ? AND user_id = ?)",
      )
      .bind(id, userId),
    db
      .prepare(
        "DELETE FROM drills WHERE workspace_id IN (SELECT id FROM workspaces WHERE id = ? AND user_id = ?)",
      )
      .bind(id, userId),
    db
      .prepare("DELETE FROM workspaces WHERE id = ? AND user_id = ?")
      .bind(id, userId),
  ]);
  return json({ deleted: true });
});
