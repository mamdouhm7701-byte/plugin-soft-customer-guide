CREATE TABLE `guide_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`activity` text NOT NULL,
	`module` text NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`frequency` integer DEFAULT 1 NOT NULL,
	`article_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
