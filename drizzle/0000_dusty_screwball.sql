CREATE TABLE `fitness_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`weight` real,
	`walk_distance` real,
	`walk_incline` real,
	`breakfast` integer DEFAULT false NOT NULL,
	`brush` integer DEFAULT false NOT NULL,
	`floss` integer DEFAULT false NOT NULL,
	`shower` integer DEFAULT false NOT NULL,
	`shake` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fitness_entries_date_unique` ON `fitness_entries` (`date`);