import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

// Ensure data directory exists
mkdirSync(join(projectRoot, 'data'), { recursive: true });

const sqlite = new Database(join(projectRoot, 'data', 'ghost.db'));
const db = drizzle(sqlite);

console.log('Running migrations...');
migrate(db, { migrationsFolder: join(projectRoot, 'drizzle') });
console.log('Migrations complete!');

sqlite.close();
