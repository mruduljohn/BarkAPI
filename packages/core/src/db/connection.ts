import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { migrate } from './schema';

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (db) return db;

  const resolvedPath = dbPath || getDefaultDbPath();
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  return db;
}

export function getDefaultDbPath(): string {
  const dataDir = process.env.BARKAPI_DATA_DIR || path.join(process.cwd(), '.barkapi');
  return path.join(dataDir, 'barkapi.db');
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
