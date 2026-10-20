import { getChatGPTUser } from "@/app/chatgpt-auth";
import { env } from "cloudflare:workers";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const MAX_BODY_BYTES = 1_048_576;
export const MAX_STORAGE_BYTES = 25 * 1024 * 1024;
// Two bound user IDs scope both sides of the aggregate. BLOB length counts UTF-8
// bytes, rather than SQLite text characters, including multiline reviewer notes.
export const USER_STORAGE_BYTES_SQL = `(COALESCE((SELECT SUM(length(CAST(dataset AS BLOB))) FROM workspaces WHERE user_id = ?), 0) + COALESCE((SELECT SUM(length(CAST(d.dataset AS BLOB)) + length(CAST(d.result AS BLOB)) + length(CAST(d.notes AS BLOB))) FROM drills d JOIN workspaces w ON w.id = d.workspace_id WHERE w.user_id = ?), 0))`;

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      Vary: "Cookie",
    },
  });
}
export function route<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
) {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError)
        return json({ error: error.message }, error.status);
      if (error instanceof ZodError)
        return json(
          {
            error: "Invalid request",
            issues: error.issues
              .slice(0, 12)
              .map((i) => ({ path: i.path.join("."), message: i.message })),
          },
          400,
        );
      console.error(
        "Lotline API failure",
        error instanceof Error ? error.name : "UnknownError",
      );
      return json(
        { error: "The request could not be completed. Please try again." },
        500,
      );
    }
  };
}
export async function authenticated() {
  const user = await getChatGPTUser();
  if (!user)
    throw new ApiError(
      401,
      "Sign in to save or access your private workspaces.",
    );
  return user.userId;
}
export function database(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db)
    throw new ApiError(
      503,
      "Private storage is not configured. You can still use the local demo.",
    );
  return db;
}
export function verifyMutation(request: Request) {
  const origin = request.headers.get("Origin");
  if (!origin || origin !== new URL(request.url).origin)
    throw new ApiError(403, "A same-origin request is required.");
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
    throw new ApiError(403, "Cross-site requests are not allowed.");
}
export async function body<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T> {
  verifyMutation(request);
  if (
    request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new ApiError(415, "Send application/json.");
  const length = request.headers.get("Content-Length");
  if (length && Number(length) > MAX_BODY_BYTES)
    throw new ApiError(413, "Request exceeds the 1 MB limit.");
  // Bound the actual stream too: Content-Length may be absent or inaccurate.
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ApiError(413, "Request exceeds the 1 MB limit.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
  } catch {
    throw new ApiError(400, "Malformed JSON body.");
  }
  return schema.parse(parsed);
}
export type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  dataset: string;
  revision: number;
  created_at: string;
  updated_at: string;
};
export async function ownedWorkspace(
  db: D1Database,
  id: string,
  userId: string,
) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id))
    throw new ApiError(404, "Workspace not found.");
  const row = await db
    .prepare("SELECT * FROM workspaces WHERE id = ? AND user_id = ?")
    .bind(id, userId)
    .first<WorkspaceRow>();
  if (!row) throw new ApiError(404, "Workspace not found.");
  return row;
}
export function publicWorkspace(row: WorkspaceRow) {
  return {
    id: row.id,
    name: row.name,
    dataset: JSON.parse(row.dataset),
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
export type IdContext = { params: Promise<{ id: string }> };
