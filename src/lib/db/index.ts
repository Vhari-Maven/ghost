import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { count } from 'drizzle-orm';
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
let _db: BunSQLiteDatabase<typeof schema> | null = null;

// Seed video_games table if empty (runs once after fresh deploy)
async function seedVideoGamesIfEmpty(db: BunSQLiteDatabase<typeof schema>) {
	const result = db.select({ count: count() }).from(schema.videoGames).get();
	if (result && result.count > 0) {
		console.log(`Video games table has ${result.count} games, skipping seed`);
		return;
	}

	console.log('Video games table is empty, seeding...');
	try {
		// Dynamic import to avoid bundling issues
		const seedData = await import('./video-games-seed.json');
		const games = seedData.default || seedData;

		if (Array.isArray(games) && games.length > 0) {
			db.insert(schema.videoGames).values(games).run();
			console.log(`Seeded ${games.length} video games`);
		}
	} catch (err) {
		console.error('Failed to seed video games:', err);
	}
}

function getDb() {
	if (!_db) {
		const sqlite = new Database(dbPath);
		sqlite.exec('PRAGMA journal_mode = WAL');
		_db = drizzle(sqlite, { schema });

		// Run migrations on first connection (handles new tables after deploy)
		if (process.env.NODE_ENV === 'production') {
			console.log('Running database migrations...');
			migrate(_db, { migrationsFolder });
			console.log('Migrations complete!');

			// Seed video games if table is empty
			seedVideoGamesIfEmpty(_db);
		}
	}
	return _db;
}

export const db = new Proxy({} as BunSQLiteDatabase<typeof schema>, {
	get(_, prop) {
		return Reflect.get(getDb(), prop);
	}
});
