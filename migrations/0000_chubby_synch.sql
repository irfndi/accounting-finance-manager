CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`type` text NOT NULL,
	`subtype` text,
	`category` text,
	`parent_id` integer,
	`level` integer DEFAULT 0 NOT NULL,
	`path` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`allow_transactions` integer DEFAULT true NOT NULL,
	`normal_balance` text NOT NULL,
	`report_category` text,
	`report_order` integer DEFAULT 0,
	`current_balance` real DEFAULT 0 NOT NULL,
	`entity_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`parent_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_code_unique` ON `accounts` (`code`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`account_id` integer NOT NULL,
	`description` text,
	`memo` text,
	`debit_amount` real DEFAULT 0 NOT NULL,
	`credit_amount` real DEFAULT 0 NOT NULL,
	`currency_code` text DEFAULT 'USD',
	`exchange_rate` real DEFAULT 1,
	`is_reconciled` integer DEFAULT false NOT NULL,
	`reconciled_at` integer,
	`reconciliation_reference` text,
	`entity_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_number` text NOT NULL,
	`reference` text,
	`description` text NOT NULL,
	`transaction_date` integer NOT NULL,
	`posting_date` integer NOT NULL,
	`type` text NOT NULL,
	`source` text NOT NULL,
	`category` text,
	`total_amount` real NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`is_reversed` integer DEFAULT false NOT NULL,
	`reversed_transaction_id` integer,
	`entity_id` text,
	`approved_by` text,
	`approved_at` integer,
	`document_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text NOT NULL,
	`updated_by` text,
	`posted_at` integer,
	`posted_by` text,
	FOREIGN KEY (`reversed_transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_transaction_number_unique` ON `transactions` (`transaction_number`);