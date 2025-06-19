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
CREATE UNIQUE INDEX `raw_docs_file_id_unique` ON `raw_docs` (`file_id`); 