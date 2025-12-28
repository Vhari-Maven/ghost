CREATE TABLE `video_games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`genre` text,
	`tier` text NOT NULL,
	`release_year` integer,
	`comment` text,
	`steam_app_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
