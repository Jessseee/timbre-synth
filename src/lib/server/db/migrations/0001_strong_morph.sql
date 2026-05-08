PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_annotations` (
	`data` text NOT NULL,
	`annotator_id` text NOT NULL,
	`task_id` text NOT NULL,
	`status` text NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`task_id`, `annotator_id`),
	FOREIGN KEY (`annotator_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_annotations`("data", "annotator_id", "task_id", "status", "createdAt") SELECT "rank", "annotator_id", "task_id", "status", "createdAt" FROM `annotations`;--> statement-breakpoint
DROP TABLE `annotations`;--> statement-breakpoint
ALTER TABLE `__new_annotations` RENAME TO `annotations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;