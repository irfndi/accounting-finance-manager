CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`code` text,
	`type` text NOT NULL,
	`subtype` text,
	`parent_id` integer,
	`level` integer DEFAULT 0 NOT NULL,
	`path` text,
	`color` text,
	`icon` text,
	`sort_order` integer DEFAULT 0,
	`default_budget_amount` real,
	`budget_period` text DEFAULT 'monthly',
	`is_active` integer DEFAULT true NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`allow_subcategories` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` integer,
	`tags` text,
	`rules` text,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE TABLE `category_stats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`period` text NOT NULL,
	`period_type` text DEFAULT 'monthly' NOT NULL,
	`transaction_count` integer DEFAULT 0 NOT NULL,
	`total_amount` real DEFAULT 0 NOT NULL,
	`average_amount` real DEFAULT 0 NOT NULL,
	`budget_amount` real,
	`budget_variance` real,
	`budget_variance_percent` real,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_id` integer NOT NULL,
	`name` text NOT NULL,
	`allocation_type` text NOT NULL,
	`allocation_code` text,
	`allocated_amount` real NOT NULL,
	`allocated_percent` real NOT NULL,
	`actual_amount` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budget_periods` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`period_type` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`fiscal_year` integer NOT NULL,
	`fiscal_quarter` integer,
	`fiscal_month` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` integer
);
--> statement-breakpoint
CREATE TABLE `budget_revisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_id` integer NOT NULL,
	`revision_number` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`previous_amount` real NOT NULL,
	`new_amount` real NOT NULL,
	`change_amount` real NOT NULL,
	`change_percent` real NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`code` text,
	`budget_period_id` integer NOT NULL,
	`category_id` integer,
	`planned_amount` real DEFAULT 0 NOT NULL,
	`revised_amount` real,
	`actual_amount` real DEFAULT 0 NOT NULL,
	`variance` real DEFAULT 0 NOT NULL,
	`variance_percent` real DEFAULT 0 NOT NULL,
	`budget_type` text NOT NULL,
	`allocation_method` text DEFAULT 'manual',
	`status` text DEFAULT 'draft' NOT NULL,
	`approved_by` integer,
	`approved_at` text,
	`warning_threshold` real DEFAULT 80,
	`critical_threshold` real DEFAULT 95,
	`tags` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`budget_period_id`) REFERENCES `budget_periods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_code_unique` ON `budgets` (`code`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_raw_docs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file_id` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`r2_key` text NOT NULL,
	`r2_bucket` text DEFAULT 'FINANCE_MANAGER_DOCUMENTS' NOT NULL,
	`extracted_text` text,
	`text_length` integer DEFAULT 0 NOT NULL,
	`ocr_confidence` real,
	`ocr_processing_time` real,
	`ocr_status` text DEFAULT 'PENDING' NOT NULL,
	`ocr_error_message` text,
	`ocr_error_code` text,
	`ocr_fallback_used` integer DEFAULT false,
	`ocr_retryable` integer DEFAULT true,
	`ocr_max_retries` integer DEFAULT 3,
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
INSERT INTO `__new_raw_docs`("id", "file_id", "original_name", "mime_type", "file_size", "r2_key", "r2_bucket", "extracted_text", "text_length", "ocr_confidence", "ocr_processing_time", "ocr_status", "ocr_error_message", "ocr_error_code", "ocr_fallback_used", "ocr_retryable", "ocr_max_retries", "ocr_processed_at", "document_type", "category", "tags", "structured_data", "llm_confidence", "llm_processed_at", "uploaded_by", "description", "searchable_text", "entity_id", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "file_id", "original_name", "mime_type", "file_size", "r2_key", "r2_bucket", "extracted_text", "text_length", "ocr_confidence", "ocr_processing_time", "ocr_status", "ocr_error_message", "ocr_error_code", "ocr_fallback_used", "ocr_retryable", "ocr_max_retries", "ocr_processed_at", "document_type", "category", "tags", "structured_data", "llm_confidence", "llm_processed_at", "uploaded_by", "description", "searchable_text", "entity_id", "created_at", "updated_at", "created_by", "updated_by" FROM `raw_docs`;--> statement-breakpoint
DROP TABLE `raw_docs`;--> statement-breakpoint
ALTER TABLE `__new_raw_docs` RENAME TO `raw_docs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `raw_docs_file_id_unique` ON `raw_docs` (`file_id`);