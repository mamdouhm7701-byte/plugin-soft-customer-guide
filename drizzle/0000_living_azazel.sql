CREATE TABLE `guide_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`draft_json` text NOT NULL,
	`draft_summary` text NOT NULL,
	`published_json` text,
	`published_summary` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`published_revision` integer,
	`archived` integer DEFAULT 0 NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE INDEX `guide_articles_status_idx` ON `guide_articles` (`status`,`archived`);--> statement-breakpoint
CREATE TABLE `guide_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `guide_audit_created_idx` ON `guide_audit` (`created_at`);--> statement-breakpoint
CREATE TABLE `guide_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`vote` text NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	`visitor_hash` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `guide_feedback_article_idx` ON `guide_feedback` (`article_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `guide_invitations` (
	`email` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`invited_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_media` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`bytes` integer NOT NULL,
	`alt` text NOT NULL,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_packs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`activity` text NOT NULL,
	`modules_json` text NOT NULL,
	`article_ids_json` text NOT NULL,
	`welcome` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_public_media` (
	`article_id` text NOT NULL,
	`media_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `media_id`),
	FOREIGN KEY (`article_id`) REFERENCES `guide_articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`media_id`) REFERENCES `guide_media`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `guide_public_media_lookup_idx` ON `guide_public_media` (`media_id`);--> statement-breakpoint
CREATE TABLE `guide_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 1 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`revision` integer NOT NULL,
	`content_json` text NOT NULL,
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `guide_articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `guide_revision_article_idx` ON `guide_revisions` (`article_id`,`revision`);--> statement-breakpoint
CREATE TABLE `guide_staff` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `guide_staff_email_idx` ON `guide_staff` (`email`);