CREATE TABLE `shopping_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'to_buy' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`ordered_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
