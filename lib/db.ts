import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH || './data/sridevi-night.db');

declare global {
  // eslint-disable-next-line no-var
  var __sridevi_db: Database.Database | undefined;
}

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS results (
      date TEXT PRIMARY KEY,
      open_pana TEXT,
      close_pana TEXT,
      jodi TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending','open','closed','holiday')),
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export function db(): Database.Database {
  if (!globalThis.__sridevi_db) globalThis.__sridevi_db = open();
  return globalThis.__sridevi_db;
}
