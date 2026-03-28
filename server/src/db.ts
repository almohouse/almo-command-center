import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = resolve(__dirname, '..', 'mission-control.db');
const SCHEMA_PATH = resolve(__dirname, '..', 'schema.sql');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Execute schema on first run (CREATE IF NOT EXISTS is idempotent)
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

export default db;
