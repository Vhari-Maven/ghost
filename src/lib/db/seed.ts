import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { fitnessEntries, taskLabels } from './schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const sqlite = new Database(join(projectRoot, 'data', 'ghost.db'));
const db = drizzle(sqlite);

// Seed data from original CSV
const seedData = [
  { date: '2025-12-09', weight: 180, walkDistance: 1.57, walkIncline: 4.5, breakfast: true, brush: true, floss: true, shower: true, shake: true },
  { date: '2025-12-10', weight: 180, walkDistance: 1.57, walkIncline: 4.5, breakfast: true, brush: true, floss: true, shower: true, shake: true },
  { date: '2025-12-11', weight: 179.4, walkDistance: 1.57, walkIncline: 5, breakfast: true, brush: true, floss: true, shower: false, shake: true },
  { date: '2025-12-12', weight: 181, walkDistance: 1.57, walkIncline: 5, breakfast: true, brush: true, floss: true, shower: false, shake: true },
  { date: '2025-12-13', weight: 183.4, walkDistance: 1.57, walkIncline: 5, breakfast: true, brush: true, floss: true, shower: true, shake: true },
];

console.log('Seeding fitness data...');

for (const entry of seedData) {
  db.insert(fitnessEntries)
    .values(entry)
    .onConflictDoNothing()
    .run();
}

console.log(`Seeded ${seedData.length} fitness entries!`);

// Default task labels
const defaultLabels = [
  { name: 'bug', color: '#ef4444' },       // red
  { name: 'feature', color: '#3b82f6' },   // blue
  { name: 'improvement', color: '#22c55e' }, // green
  { name: 'research', color: '#a855f7' },  // purple
  { name: 'urgent', color: '#f97316' },    // orange
];

console.log('Seeding task labels...');

for (const label of defaultLabels) {
  db.insert(taskLabels)
    .values(label)
    .onConflictDoNothing()
    .run();
}

console.log(`Seeded ${defaultLabels.length} task labels!`);
sqlite.close();
