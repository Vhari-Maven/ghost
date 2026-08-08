CREATE TABLE `argent_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`balance_cents` integer NOT NULL,
	`roth_basis_cents` integer,
	`cost_basis_cents` integer
);
--> statement-breakpoint
CREATE TABLE `argent_assumptions` (
	`id` integer PRIMARY KEY NOT NULL,
	`birth_date` text NOT NULL,
	`inflation_pct` real NOT NULL,
	`nominal_return_pct` real NOT NULL,
	`wage_growth_pct` real,
	`retirement_age` integer NOT NULL,
	`ss_claiming_age` integer NOT NULL,
	`state_tax_pct` real NOT NULL,
	`end_age` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `argent_earnings_history` (
	`year` integer PRIMARY KEY NOT NULL,
	`earnings_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `argent_expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`annual_cents` integer NOT NULL,
	`applies` text DEFAULT 'always' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `argent_job` (
	`id` integer PRIMARY KEY NOT NULL,
	`salary_cents` integer NOT NULL,
	`service_start_date` text NOT NULL,
	`tsp_traditional_pct` real NOT NULL,
	`tsp_roth_pct` real NOT NULL,
	`fers_contribution_pct` real NOT NULL,
	`employer_health_cents` integer NOT NULL,
	`employee_health_cents` integer NOT NULL
);
