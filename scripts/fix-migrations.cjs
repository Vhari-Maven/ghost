// Fix missing migrations in production
// Run with: node scripts/fix-migrations.js

const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || '/data/ghost.db';
const db = new Database(dbPath);

console.log('Checking database:', dbPath);

// Check existing tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Existing tables:', tables.map(t => t.name));

// Check existing migrations
const migrations = db.prepare('SELECT * FROM __drizzle_migrations').all();
console.log('Recorded migrations:', migrations.length);

// Check if shopping_items exists
const hasShoppingItems = tables.some(t => t.name === 'shopping_items');
console.log('Has shopping_items table:', hasShoppingItems);

// Check if exercise tables exist
const hasExerciseSessions = tables.some(t => t.name === 'exercise_sessions');
console.log('Has exercise_sessions table:', hasExerciseSessions);

// If shopping_items exists but only 2 migrations recorded, add the missing migration record
if (hasShoppingItems && migrations.length === 2) {
  console.log('\nAdding missing migration record for 0002_thick_slayback...');

  // Calculate the hash (same way drizzle does it)
  const migrationPath = path.join(__dirname, '..', 'drizzle', '0002_thick_slayback.sql');
  const content = fs.readFileSync(migrationPath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');

  db.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(hash, 1766189951271);
  console.log('Added migration record with hash:', hash);
}

// Now create exercise tables if they don't exist
if (!hasExerciseSessions) {
  console.log('\nCreating exercise tables...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercise_sessions (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      date text NOT NULL UNIQUE,
      workout_type text NOT NULL,
      completed_at text,
      notes text,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS exercise_logs (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      session_id integer NOT NULL,
      exercise_id text NOT NULL,
      set_number integer NOT NULL,
      reps integer,
      weight real,
      duration integer,
      completed integer DEFAULT false NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (session_id) REFERENCES exercise_sessions(id) ON DELETE CASCADE
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS always_do_logs (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      session_id integer NOT NULL,
      exercise_id text NOT NULL,
      completed integer DEFAULT false NOT NULL,
      duration integer,
      reps integer,
      created_at text NOT NULL,
      FOREIGN KEY (session_id) REFERENCES exercise_sessions(id) ON DELETE CASCADE
    );
  `);

  console.log('Exercise tables created!');

  // Add migration record for 0003
  const migrationPath = path.join(__dirname, '..', 'drizzle', '0003_volatile_boomer.sql');
  const content = fs.readFileSync(migrationPath, 'utf8');
  const hash = crypto.createHash('sha256').update(content).digest('hex');

  db.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(hash, 1766264551960);
  console.log('Added migration record for 0003 with hash:', hash);
}

// Final check
const finalTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
const finalMigrations = db.prepare('SELECT * FROM __drizzle_migrations').all();
console.log('\nFinal state:');
console.log('Tables:', finalTables.map(t => t.name));
console.log('Migrations:', finalMigrations.length);

db.close();
console.log('\nDone!');
