CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`session_id` text,
	`event_type` text NOT NULL,
	`event_category` text NOT NULL,
	`description` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`location` text,
	`metadata` text,
	`success` integer NOT NULL,
	`error_code` text,
	`error_message` text,
	`entity_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `magic_links` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`email` text NOT NULL,
	`token` text NOT NULL,
	`token_hash` text NOT NULL,
	`purpose` text NOT NULL,
	`metadata` text,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`click_count` integer DEFAULT 0 NOT NULL,
	`last_click_at` integer,
	`last_click_ip` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `magic_links_token_unique` ON `magic_links` (`token`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`device_info` text,
	`ip_address` text,
	`location` text,
	`issued_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`revoked_at` integer,
	`revoked_by` text,
	`revoked_reason` text,
	`kv_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`password_hash` text,
	`first_name` text,
	`last_name` text,
	`display_name` text,
	`timezone` text DEFAULT 'UTC',
	`locale` text DEFAULT 'en',
	`is_active` integer DEFAULT true NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'USER' NOT NULL,
	`permissions` text,
	`entity_id` text,
	`entity_access` text,
	`last_login_at` integer,
	`last_login_ip` text,
	`failed_login_attempts` integer DEFAULT 0 NOT NULL,
	`locked_until` integer,
	`two_factor_enabled` integer DEFAULT false NOT NULL,
	`two_factor_secret` text,
	`backup_codes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`created_by` text,
	`updated_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);