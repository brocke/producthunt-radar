CREATE TABLE `watchlist` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ph_post_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`thumbnail_url` text,
	`added_at` integer NOT NULL,
	`note` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_ph_post_id_unique` ON `watchlist` (`ph_post_id`);