CREATE TABLE `fitbit_daily_data` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`zone_out_of_range` integer,
	`zone_fat_burn` integer,
	`zone_cardio` integer,
	`zone_peak` integer,
	`resting_heart_rate` integer,
	`sleep_duration` integer,
	`sleep_efficiency` integer,
	`sleep_deep` integer,
	`sleep_light` integer,
	`sleep_rem` integer,
	`sleep_awake` integer,
	`calories_burned` integer,
	`synced_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fitbit_daily_data_date_unique` ON `fitbit_daily_data` (`date`);--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`provider` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`scope` text,
	`user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
