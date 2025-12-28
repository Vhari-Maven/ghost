CREATE TABLE `meal_prep_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`breakfast` integer DEFAULT true NOT NULL,
	`salmon` integer DEFAULT true NOT NULL,
	`bean_soup` integer DEFAULT true NOT NULL,
	`med_bowl` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
