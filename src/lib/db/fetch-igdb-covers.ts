/**
 * Fetch cover images from IGDB for non-Steam games
 * Run with: npx tsx src/lib/db/fetch-igdb-covers.ts
 *
 * Requires TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, isNull } from 'drizzle-orm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { videoGames } from './schema';

// Load .env file manually
function loadEnv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '..', '..', '..', '.env');

  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          process.env[key] = valueParts.join('=');
        }
      }
    }
  } catch {
    // .env file not found, rely on existing env vars
  }
}

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
  console.error('Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment');
  process.exit(1);
}

// Get OAuth token from Twitch
async function getTwitchToken(): Promise<string> {
  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: TWITCH_CLIENT_ID!,
      client_secret: TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitch auth failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Search IGDB for a game and get its cover
async function searchGame(
  token: string,
  gameName: string
): Promise<{ name: string; coverUrl: string | null } | null> {
  // Search for the game
  const searchResponse = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': TWITCH_CLIENT_ID!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'text/plain',
    },
    body: `search "${gameName}"; fields name, cover.image_id; limit 5;`,
  });

  if (!searchResponse.ok) {
    console.error(`  IGDB search failed: ${searchResponse.status}`);
    return null;
  }

  const games = await searchResponse.json();

  if (games.length === 0) {
    return null;
  }

  // Find best match (prefer exact or close match)
  const normalizedSearch = gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let bestMatch = games[0];

  for (const game of games) {
    const normalizedName = game.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedName === normalizedSearch) {
      bestMatch = game;
      break;
    }
    // Check for partial match
    if (normalizedName.includes(normalizedSearch) || normalizedSearch.includes(normalizedName)) {
      bestMatch = game;
    }
  }

  if (!bestMatch.cover?.image_id) {
    return { name: bestMatch.name, coverUrl: null };
  }

  // Build cover URL (cover_big = 264x374, good aspect ratio for cards)
  const coverUrl = `https://images.igdb.com/igdb/image/upload/t_cover_big/${bestMatch.cover.image_id}.jpg`;

  return { name: bestMatch.name, coverUrl };
}

async function main() {
  console.log('Fetching cover images from IGDB...\n');

  // Get token
  console.log('Getting Twitch OAuth token...');
  const token = await getTwitchToken();
  console.log('Token obtained!\n');

  // Find games without Steam IDs (our Blizzard games + Starsector)
  const gamesWithoutSteam = await db
    .select({ id: videoGames.id, name: videoGames.name, coverUrl: videoGames.coverUrl })
    .from(videoGames)
    .where(isNull(videoGames.steamAppId));

  console.log(`Found ${gamesWithoutSteam.length} games without Steam IDs:\n`);

  let updated = 0;
  let notFound = 0;

  for (const game of gamesWithoutSteam) {
    process.stdout.write(`  "${game.name}" `);

    // Skip if already has a cover URL
    if (game.coverUrl) {
      console.log('→ already has coverUrl, skipping');
      continue;
    }

    const result = await searchGame(token, game.name);

    if (!result) {
      console.log('→ NOT FOUND');
      notFound++;
      continue;
    }

    if (!result.coverUrl) {
      console.log(`→ found "${result.name}" but no cover image`);
      notFound++;
      continue;
    }

    // Update database
    await db
      .update(videoGames)
      .set({
        coverUrl: result.coverUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(videoGames.id, game.id));

    console.log(`→ "${result.name}" ✓`);
    updated++;

    // Rate limit: IGDB allows 4 requests/second, use 300ms to stay safe
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Updated: ${updated} games`);
  console.log(`Not found: ${notFound} games`);

  // Show current state
  const allGames = await db
    .select({
      name: videoGames.name,
      steamAppId: videoGames.steamAppId,
      coverUrl: videoGames.coverUrl
    })
    .from(videoGames);

  const withSteam = allGames.filter(g => g.steamAppId);
  const withCover = allGames.filter(g => g.coverUrl);
  const withNeither = allGames.filter(g => !g.steamAppId && !g.coverUrl);

  console.log(`\nCoverage:`);
  console.log(`  Steam headers: ${withSteam.length} games`);
  console.log(`  Custom covers: ${withCover.length} games`);
  console.log(`  No cover: ${withNeither.length} games`);

  if (withNeither.length > 0) {
    console.log(`\nGames still without covers:`);
    for (const game of withNeither) {
      console.log(`  - ${game.name}`);
    }
  }

  sqlite.close();
  console.log('\nDone!');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
