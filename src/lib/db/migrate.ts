import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

// Use DATABASE_PATH env var in production, fall back to local data folder
const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');

// Ensure parent directory exists
mkdirSync(dirname(dbPath), { recursive: true });

console.log(`Running migrations on ${dbPath}...`);
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: join(projectRoot, 'drizzle') });
console.log('Migrations complete!');

sqlite.close();
