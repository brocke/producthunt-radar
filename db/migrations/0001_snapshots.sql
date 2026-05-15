CREATE TABLE `snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ph_post_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`votes_count` integer NOT NULL,
	`comments_count` integer NOT NULL,
	`topics` text,
	`snapshot_at` integer NOT NULL,
	`posted_at` integer,
	`thumbnail_url` text
);
