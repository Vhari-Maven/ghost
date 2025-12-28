/**
 * Script to look up Steam App IDs for games in the database
 * Run with: npx tsx src/lib/db/lookup-steam-ids.ts
 *
 * Uses Steam's search suggest endpoint to find game IDs.
 * Outputs matches to console for review. Use --update flag to write to DB.
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { eq, isNull } from 'drizzle-orm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { videoGames } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Rate limiting - be nice to Steam
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SteamResult = {
  appid: string;
  name: string;
  imgUrl?: string;
};

type SteamMatch = {
  gameId: number;
  gameName: string;
  steamAppId: string | null;
  steamName: string | null;
  confidence: 'exact' | 'close' | 'fuzzy' | 'none';
  allMatches?: SteamResult[];
};

// Normalize names for comparison
function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[:'"\-–—®™]/g, '') // Remove punctuation and trademark symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Check how close two names are
function getConfidence(
  gameName: string,
  steamName: string
): 'exact' | 'close' | 'fuzzy' {
  const n1 = normalize(gameName);
  const n2 = normalize(steamName);

  if (n1 === n2) return 'exact';

  // Check if one starts with the other (handles "Mass Effect" vs "Mass Effect (2007)")
  if (n2.startsWith(n1) || n1.startsWith(n2)) return 'close';

  // Check if one contains the other
  if (n1.includes(n2) || n2.includes(n1)) return 'close';

  // Check word overlap
  const words1 = n1.split(' ').filter((w) => w.length > 2);
  const words2 = n2.split(' ').filter((w) => w.length > 2);
  const shared = words1.filter((w) => words2.includes(w));

  if (shared.length >= Math.min(words1.length, words2.length) * 0.7)
    return 'close';

  return 'fuzzy';
}

// Search Steam for a game
async function searchSteam(query: string): Promise<SteamResult[]> {
  const url = `https://store.steampowered.com/search/suggest?term=${encodeURIComponent(query)}&f=games&cc=us&l=english`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Parse HTML to extract app IDs and names
    const results: SteamResult[] = [];
    const regex =
      /data-ds-appid="(\d+)"[^>]*>.*?<div class="match_name">([^<]+)<\/div>.*?<img src="([^"]+)"/gs;

    let match;
    while ((match = regex.exec(html)) !== null) {
      results.push({
        appid: match[1],
        name: match[2],
        imgUrl: match[3],
      });
    }

    return results;
  } catch (error) {
    console.error(`    Steam search error:`, error);
    return [];
  }
}

async function lookupGame(
  gameId: number,
  gameName: string
): Promise<SteamMatch> {
  const results = await searchSteam(gameName);

  if (results.length === 0) {
    return {
      gameId,
      gameName,
      steamAppId: null,
      steamName: null,
      confidence: 'none',
    };
  }

  // Find the best match
  let bestMatch = results[0];
  let bestConfidence: 'exact' | 'close' | 'fuzzy' = getConfidence(
    gameName,
    results[0].name
  );

  for (const result of results) {
    const conf = getConfidence(gameName, result.name);
    if (conf === 'exact') {
      bestMatch = result;
      bestConfidence = 'exact';
      break;
    } else if (conf === 'close' && bestConfidence === 'fuzzy') {
      bestMatch = result;
      bestConfidence = 'close';
    }
  }

  return {
    gameId,
    gameName,
    steamAppId: bestMatch.appid,
    steamName: bestMatch.name,
    confidence: bestConfidence,
    allMatches: results.slice(0, 5),
  };
}

async function main() {
  const shouldUpdate = process.argv.includes('--update');
  const onlyMissing = !process.argv.includes('--all');

  console.log('Steam App ID Lookup Tool');
  console.log('========================\n');

  // Get games (either all or just those without Steam IDs)
  const games = onlyMissing
    ? await db
        .select({
          id: videoGames.id,
          name: videoGames.name,
          steamAppId: videoGames.steamAppId,
        })
        .from(videoGames)
        .where(isNull(videoGames.steamAppId))
    : await db
        .select({
          id: videoGames.id,
          name: videoGames.name,
          steamAppId: videoGames.steamAppId,
        })
        .from(videoGames);

  console.log(
    `Found ${games.length} games ${onlyMissing ? 'without Steam App IDs' : 'total'}\n`
  );

  if (games.length === 0) {
    console.log('All games have Steam IDs! Nothing to do.');
    sqlite.close();
    return;
  }

  const exact: SteamMatch[] = [];
  const close: SteamMatch[] = [];
  const fuzzy: SteamMatch[] = [];
  const notFound: SteamMatch[] = [];

  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    process.stdout.write(`[${i + 1}/${games.length}] "${game.name}" `);

    const match = await lookupGame(game.id, game.name);

    if (match.confidence === 'exact') {
      exact.push(match);
      console.log(`✓ ${match.steamName} (${match.steamAppId})`);
    } else if (match.confidence === 'close') {
      close.push(match);
      console.log(`~ ${match.steamName} (${match.steamAppId})`);
    } else if (match.confidence === 'fuzzy') {
      fuzzy.push(match);
      console.log(`? ${match.steamName} (${match.steamAppId})`);
    } else {
      notFound.push(match);
      console.log('✗ NOT FOUND');
    }

    // Rate limit - 500ms between requests
    await delay(500);
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`✓ Exact matches:  ${exact.length}`);
  console.log(`~ Close matches:  ${close.length}`);
  console.log(`? Fuzzy matches:  ${fuzzy.length}`);
  console.log(`✗ Not found:      ${notFound.length}`);

  // Show items needing review
  if (close.length > 0) {
    console.log('\n--- CLOSE MATCHES (will be saved with --update) ---');
    for (const m of close) {
      console.log(`  "${m.gameName}" → "${m.steamName}" (${m.steamAppId})`);
    }
  }

  if (fuzzy.length > 0) {
    console.log('\n--- FUZZY MATCHES (need manual review) ---');
    for (const m of fuzzy) {
      console.log(`  "${m.gameName}" → "${m.steamName}" (${m.steamAppId})`);
      if (m.allMatches && m.allMatches.length > 1) {
        console.log(
          '    Other options:',
          m.allMatches
            .slice(1)
            .map((x) => `${x.name} (${x.appid})`)
            .join(', ')
        );
      }
    }
  }

  if (notFound.length > 0) {
    console.log('\n--- NOT FOUND (not on Steam or search failed) ---');
    for (const m of notFound) {
      console.log(`  "${m.gameName}"`);
    }
  }

  // Update database if requested
  if (shouldUpdate) {
    console.log('\n\n=== UPDATING DATABASE ===');

    // Only update exact and close matches
    const toUpdate = [...exact, ...close];
    let updated = 0;

    for (const match of toUpdate) {
      if (match.steamAppId) {
        await db
          .update(videoGames)
          .set({
            steamAppId: match.steamAppId,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(videoGames.id, match.gameId));
        updated++;
      }
    }

    console.log(`Updated ${updated} games with Steam IDs.`);
    console.log(
      `Skipped ${fuzzy.length + notFound.length} games that need manual review.`
    );
  } else {
    console.log(
      '\n\nRun with --update to save exact and close matches to the database.'
    );
    console.log(
      'Use --all to re-lookup all games (not just those missing Steam IDs).'
    );
  }

  sqlite.close();
}

main().catch((err) => {
  console.error('Lookup failed:', err);
  process.exit(1);
});
