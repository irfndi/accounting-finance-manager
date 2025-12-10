CREATE TABLE `column_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`source_column` text NOT NULL,
	`target_field` text NOT NULL,
	`confidence` real NOT NULL,
	`data_type` text NOT NULL,
	`transformation` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `data_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`detected_format` text,
	`row_count` integer,
	`imported_count` integer,
	`error_count` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `insights_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`insight_type` text NOT NULL,
	`data` text NOT NULL,
	`generated_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`integration_type` text NOT NULL,
	`status` text NOT NULL,
	`config` text NOT NULL,
	`last_sync_at` integer,
	`next_sync_at` integer,
	`error_message` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tier` text NOT NULL,
	`status` text NOT NULL,
	`transaction_limit` integer,
	`transaction_count` integer DEFAULT 0,
	`integration_limit` integer,
	`started_at` integer NOT NULL,
	`expires_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_subscriptions_user_id_unique` ON `user_subscriptions` (`user_id`);--> statement-breakpoint
CREATE TABLE `validation_warnings` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_id` text NOT NULL,
	`import_id` text,
	`transaction_id` text,
	`warning_type` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`suggested_action` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
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
	`created_by` text,
	`tags` text,
	`rules` text,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "description", "code", "type", "subtype", "parent_id", "level", "path", "color", "icon", "sort_order", "default_budget_amount", "budget_period", "is_active", "is_system", "allow_subcategories", "created_at", "updated_at", "created_by", "tags", "rules") SELECT "id", "name", "description", "code", "type", "subtype", "parent_id", "level", "path", "color", "icon", "sort_order", "default_budget_amount", "budget_period", "is_active", "is_system", "allow_subcategories", "created_at", "updated_at", "created_by", "tags", "rules" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE TABLE `__new_budget_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_id` integer NOT NULL,
	`category_id` integer,
	`name` text,
	`description` text,
	`priority` integer DEFAULT 0,
	`constraints` text,
	`allocation_type` text NOT NULL,
	`allocation_code` text,
	`allocated_amount` real NOT NULL,
	`allocated_percent` real NOT NULL,
	`actual_amount` real DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` text,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_budget_allocations`("id", "budget_id", "category_id", "name", "description", "priority", "constraints", "allocation_type", "allocation_code", "allocated_amount", "allocated_percent", "actual_amount", "is_active", "created_at", "updated_at", "created_by") SELECT "id", "budget_id", "category_id", "name", "description", "priority", "constraints", "allocation_type", "allocation_code", "allocated_amount", "allocated_percent", "actual_amount", "is_active", "created_at", "updated_at", "created_by" FROM `budget_allocations`;--> statement-breakpoint
DROP TABLE `budget_allocations`;--> statement-breakpoint
ALTER TABLE `__new_budget_allocations` RENAME TO `budget_allocations`;--> statement-breakpoint
CREATE TABLE `__new_budget_periods` (
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
	`created_by` text
);
--> statement-breakpoint
INSERT INTO `__new_budget_periods`("id", "name", "description", "period_type", "start_date", "end_date", "status", "is_active", "fiscal_year", "fiscal_quarter", "fiscal_month", "created_at", "updated_at", "created_by") SELECT "id", "name", "description", "period_type", "start_date", "end_date", "status", "is_active", "fiscal_year", "fiscal_quarter", "fiscal_month", "created_at", "updated_at", "created_by" FROM `budget_periods`;--> statement-breakpoint
DROP TABLE `budget_periods`;--> statement-breakpoint
ALTER TABLE `__new_budget_periods` RENAME TO `budget_periods`;--> statement-breakpoint
CREATE TABLE `__new_budget_revisions` (
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
	`approved_by` text,
	`approved_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` text,
	FOREIGN KEY (`budget_id`) REFERENCES `budgets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_budget_revisions`("id", "budget_id", "revision_number", "reason", "description", "previous_amount", "new_amount", "change_amount", "change_percent", "status", "approved_by", "approved_at", "created_at", "created_by") SELECT "id", "budget_id", "revision_number", "reason", "description", "previous_amount", "new_amount", "change_amount", "change_percent", "status", "approved_by", "approved_at", "created_at", "created_by" FROM `budget_revisions`;--> statement-breakpoint
DROP TABLE `budget_revisions`;--> statement-breakpoint
ALTER TABLE `__new_budget_revisions` RENAME TO `budget_revisions`;--> statement-breakpoint
CREATE TABLE `__new_budgets` (
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
	`approved_by` text,
	`approved_at` text,
	`warning_threshold` real DEFAULT 80,
	`critical_threshold` real DEFAULT 95,
	`tags` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`created_by` text,
	FOREIGN KEY (`budget_period_id`) REFERENCES `budget_periods`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_budgets`("id", "name", "description", "code", "budget_period_id", "category_id", "planned_amount", "revised_amount", "actual_amount", "variance", "variance_percent", "budget_type", "allocation_method", "status", "approved_by", "approved_at", "warning_threshold", "critical_threshold", "tags", "notes", "created_at", "updated_at", "created_by") SELECT "id", "name", "description", "code", "budget_period_id", "category_id", "planned_amount", "revised_amount", "actual_amount", "variance", "variance_percent", "budget_type", "allocation_method", "status", "approved_by", "approved_at", "warning_threshold", "critical_threshold", "tags", "notes", "created_at", "updated_at", "created_by" FROM `budgets`;--> statement-breakpoint
DROP TABLE `budgets`;--> statement-breakpoint
ALTER TABLE `__new_budgets` RENAME TO `budgets`;--> statement-breakpoint
CREATE UNIQUE INDEX `budgets_code_unique` ON `budgets` (`code`);