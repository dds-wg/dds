CREATE TABLE `project_backfills` (
	`project_uri` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`started_at_ms` integer,
	`completed_at_ms` integer,
	`records_added` integer DEFAULT 0 NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `records` (
	`uri` text PRIMARY KEY NOT NULL,
	`cid` text NOT NULL,
	`did` text NOT NULL,
	`collection` text NOT NULL,
	`rkey` text NOT NULL,
	`record_created_at_ms` integer NOT NULL,
	`indexed_at_ms` integer NOT NULL,
	`project_uri` text,
	`phase` text,
	`target_uri` text,
	`subject_uri` text,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_records_collection` ON `records` (`collection`);--> statement-breakpoint
CREATE INDEX `idx_records_project_step` ON `records` (`project_uri`,`phase`,`collection`);--> statement-breakpoint
CREATE INDEX `idx_records_target` ON `records` (`target_uri`);--> statement-breakpoint
CREATE INDEX `idx_records_subject` ON `records` (`subject_uri`);--> statement-breakpoint
CREATE INDEX `idx_records_did_collection` ON `records` (`did`,`collection`);--> statement-breakpoint
CREATE INDEX `idx_records_created` ON `records` (`record_created_at_ms`);