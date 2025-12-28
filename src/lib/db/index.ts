import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get database path from env or default to local data directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');
const migrationsFolder = join(projectRoot, 'drizzle');

// Lazy initialization to avoid build-time errors (SvelteKit prerender imports this file)
let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb() {
	if (!_db) {
		const sqlite = new Database(dbPath);
		sqlite.pragma('journal_mode = WAL');
		_db = drizzle(sqlite, { schema });

		// Run migrations on first connection (handles new tables after deploy)
		if (process.env.NODE_ENV === 'production') {
			console.log('Running database migrations...');
			migrate(_db, { migrationsFolder });
			console.log('Migrations complete!');
		}
	}
	return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
	get(_, prop) {
		return Reflect.get(getDb(), prop);
	}
});
