CREATE TABLE `drills` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`lot` text NOT NULL,
	`notes` text NOT NULL,
	`result` text NOT NULL,
	`dataset` text NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `drills_workspace_idx` ON `drills` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`kind` text NOT NULL,
	`revision` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `events_workspace_idx` ON `events` (`workspace_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`dataset` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `workspaces_user_idx` ON `workspaces` (`user_id`);--> statement-breakpoint
CREATE TRIGGER workspaces_created_audit AFTER INSERT ON workspaces
BEGIN
 INSERT INTO events (id, workspace_id, action, detail, kind, revision, created_at)
 VALUES (lower(hex(randomblob(16))), NEW.id, 'Workspace created', 'Records saved to private storage.', 'system', NEW.revision, NEW.created_at);
END;
--> statement-breakpoint
CREATE TRIGGER workspaces_updated_audit AFTER UPDATE ON workspaces
BEGIN
 INSERT INTO events (id, workspace_id, action, detail, kind, revision, created_at)
 VALUES (lower(hex(randomblob(16))), NEW.id, 'Workspace updated', 'Records saved as revision ' || NEW.revision || '.', 'system', NEW.revision, NEW.updated_at);
END;
--> statement-breakpoint
CREATE TRIGGER drills_created_audit AFTER INSERT ON drills
BEGIN
 INSERT INTO events (id, workspace_id, action, detail, kind, revision, created_at)
 VALUES (lower(hex(randomblob(16))), NEW.workspace_id, 'Drill snapshot saved', 'Immutable record-based trace saved for lot ' || NEW.lot || '.', 'system', NEW.revision, NEW.created_at);
END;
