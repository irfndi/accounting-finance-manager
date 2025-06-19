CREATE TABLE `raw_docs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`r2_key` text NOT NULL,
	`r2_bucket` text DEFAULT 'FINANCE_MANAGER_DOCUMENTS' NOT NULL,
	`extracted_text` text,
	`text_length` integer DEFAULT 0,
	`ocr_confidence` real,
	`ocr_processing_time` real,
	`ocr_status` text DEFAULT 'PENDING' NOT NULL,
	`ocr_error_message` text,
	`ocr_processed_at` integer,
	`document_type` text,
	`category` text,
	`tags` text,
	`structured_data` text,
	`llm_confidence` real,
	`llm_processed_at` integer,
	`uploaded_by` text NOT NULL,
	`description` text,
	`searchable_text` text,
	`entity_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `raw_docs_file_id_unique` ON `raw_docs` (`file_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_accounts` (
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
	`is_active` integer DEFAULT 1 NOT NULL,
	`is_system` integer DEFAULT 0 NOT NULL,
	`allow_transactions` integer DEFAULT 1 NOT NULL,
	`normal_balance` text NOT NULL,
	`report_category` text,
	`report_order` integer DEFAULT 0,
	`current_balance` real DEFAULT 0 NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`parent_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_accounts`("id", "code", "name", "description", "type", "subtype", "category", "parent_id", "level", "path", "is_active", "is_system", "allow_transactions", "normal_balance", "report_category", "report_order", "current_balance", "entity_id", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "code", "name", "description", "type", "subtype", "category", "parent_id", "level", "path", "is_active", "is_system", "allow_transactions", "normal_balance", "report_category", "report_order", "current_balance", "entity_id", "created_at", "updated_at", "created_by", "updated_by" FROM `accounts`;--> statement-breakpoint
DROP TABLE `accounts`;--> statement-breakpoint
ALTER TABLE `__new_accounts` RENAME TO `accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_code_unique` ON `accounts` (`code`);