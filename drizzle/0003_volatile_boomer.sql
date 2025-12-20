CREATE TABLE `always_do_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`duration` integer,
	`reps` integer,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `exercise_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercise_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`reps` integer,
	`weight` real,
	`duration` integer,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `exercise_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `exercise_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`workout_type` text NOT NULL,
	`completed_at` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_sessions_date_unique` ON `exercise_sessions` (`date`);