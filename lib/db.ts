// Drizzle + better-sqlite3 setup. Server-only.
//
// The SQLite handle is cached on globalThis so Next.js dev-mode HMR doesn't
// re-open the file repeatedly. Migrations run once per process at first import.

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";

import * as schema from "@/db/schema";

// In Docker we mount a volume on /data and point DB_PATH there so the
// database survives container rebuilds. Locally we fall back to db/data.db.
const DB_PATH =
  process.env.DB_PATH ?? path.join(process.cwd(), "db", "data.db");
const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ??
  path.join(process.cwd(), "db", "migrations");

declare global {
  // eslint-disable-next-line no-var
  var __sqlite: Database.Database | undefined;
  // eslint-disable-next-line no-var
  var __migrated: boolean | undefined;
}

const sqlite = globalThis.__sqlite ?? new Database(DB_PATH);
if (process.env.NODE_ENV !== "production") {
  globalThis.__sqlite = sqlite;
}
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;

if (!globalThis.__migrated) {
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  globalThis.__migrated = true;
}
