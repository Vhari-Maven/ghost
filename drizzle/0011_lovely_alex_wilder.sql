CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`media_type` text NOT NULL,
	`tier` text NOT NULL,
	`genre` text,
	`release_year` integer,
	`tmdb_id` text,
	`poster_url` text,
	`comment` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
