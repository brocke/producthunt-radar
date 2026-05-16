CREATE TABLE `lens_scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ph_post_id` text NOT NULL,
	`lens_key` text NOT NULL,
	`score` integer NOT NULL,
	`reason` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lens_scores_post_lens_unique` ON `lens_scores` (`ph_post_id`,`lens_key`);
