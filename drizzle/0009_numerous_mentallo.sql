ALTER TABLE `fitbit_daily_data` ADD `steps` integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `oauth_tokens_provider_idx` ON `oauth_tokens` (`provider`);