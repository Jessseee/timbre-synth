CREATE TABLE `annotations` (
	`rank` text NOT NULL,
	`annotator_id` text NOT NULL,
	`task_id` text NOT NULL,
	`status` text NOT NULL,
	`createdAt` integer NOT NULL,
	PRIMARY KEY(`task_id`, `annotator_id`),
	FOREIGN KEY (`annotator_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questionnaires` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`questionnaire` text NOT NULL,
	`annotator_id` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`annotator_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `questionnaires_annotator_id_unique` ON `questionnaires` (`annotator_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`admin` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sounds` (
	`id` text PRIMARY KEY NOT NULL,
	`params` text NOT NULL,
	`notes` text
);
--> statement-breakpoint
CREATE TABLE `task_sounds` (
	`task_id` text NOT NULL,
	`sound_id` text NOT NULL,
	PRIMARY KEY(`task_id`, `sound_id`),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sound_id`) REFERENCES `sounds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`descriptor` text NOT NULL,
	`session_id` text,
	`tutorial` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE no action
);
