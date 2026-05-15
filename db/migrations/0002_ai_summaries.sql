CREATE TABLE `ai_summaries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ph_post_id` text NOT NULL,
	`summary` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ai_summaries_ph_post_id_unique` ON `ai_summaries` (`ph_post_id`);