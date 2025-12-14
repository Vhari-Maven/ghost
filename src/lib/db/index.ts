import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const sqlite = new Database(join(projectRoot, 'data', 'ghost.db'));
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
