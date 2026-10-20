import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    dataset: text("dataset").notNull(),
    revision: integer("revision").notNull().default(1),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [index("workspaces_user_idx").on(table.userId)],
);

export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    detail: text("detail").notNull(),
    kind: text("kind").notNull(),
    revision: integer("revision").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("events_workspace_idx").on(table.workspaceId, table.createdAt),
  ],
);

export const drills = sqliteTable(
  "drills",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    lot: text("lot").notNull(),
    notes: text("notes").notNull(),
    result: text("result").notNull(),
    dataset: text("dataset").notNull(),
    revision: integer("revision").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("drills_workspace_idx").on(table.workspaceId, table.createdAt),
  ],
);

// Shared, durable quota across Worker instances; prevents configured AI-key abuse.
export const aiUsage = sqliteTable("ai_usage", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});
