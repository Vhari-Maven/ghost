/**
 * Apply Steam App IDs to games database
 * Run with: bun src/lib/db/apply-steam-ids.ts
 */

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { videoGames } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// All Steam IDs to apply (game name -> steam app id)
// Includes exact matches, corrected close matches, and manual fixes
const STEAM_IDS: Record<string, string> = {
  // === EXACT MATCHES (67) ===
  'Factorio': '427520',
  'Cataclysm: Dark Days Ahead': '2330750',
  'Stellaris': '281990',
  'Subnautica': '264710',
  '7 Days to Die': '251570',
  'XCOM 2': '268500',
  'V Rising': '1604030',
  'Among Us': '945360',
  'Rimworld': '294100',
  'XCOM: Enemy Unknown': '200510',
  'Kerbal Space Program': '220200',
  'Terraria': '105600',
  'Subterrain': '340490',
  'Distant Worlds: Universe': '261470',
  'Cyberpunk 2077': '1091500',
  'Anno 2070': '48240',
  'I Was a Teenage Exocolonist': '1148760',
  'Thea: The Awakening': '378720',
  'The Last Spell': '1105670',
  'Battle Brothers': '365360',
  'Valheim': '892970',
  'Slay the Spire': '646570',
  'Dying Light': '239140',
  'Metal Gear Solid V: The Phantom Pain': '287700',
  'Heat Signature': '268130',
  'Barotrauma': '602960',
  'Portal 2': '620',
  'This War of Mine': '282070',
  'Space Engineers': '244850',
  'Orb of Creation': '1910680',
  "No Man's Sky": '275850',
  "Baldur's Gate 3": '1086940',
  'Bitburner': '1812820',
  'Shogun Showdown': '2084000',
  'Across the Obelisk': '1385380',
  'Renowned Explorers: International Society': '296970',
  'Dig or Die': '315460',
  'Space Pirates and Zombies': '107200',
  'Rebel Galaxy': '290300',
  'Warhammer: Vermintide 2': '552500',
  'Roadwarden': '1155970',
  'Lethal Company': '1966720',
  'Book of Hours': '1028310',
  'Cultist Simulator': '718670',
  'Apex Legends': '1172470',
  'Against the Storm': '1336490',
  'CrossCode': '368340',
  'Star Realms': '438140',
  'Warlock: Master of the Arcane': '203630',
  'Duskers': '254320',
  'Mindustry': '1127400',
  'Oxygen Not Included': '457140',
  'Prismata': '490220',
  'The Long Dark': '305620',
  'Monster Train': '1102190',
  'Dragon Age: Inquisition': '1222690',
  'The Sims 4': '1222670',
  "Don't Starve": '219740',
  'Starbound': '211820',
  'They Are Billions': '644930',
  'The Walking Dead': '207610',
  'Tales of Berseria': '429660',
  "Assassin's Creed: Odyssey": '812140',
  'Kingdoms of Amalur: Reckoning': '102500',
  'Salt and Sanctuary': '283640',
  'Pillars of Eternity': '291650',
  'DOTA 2': '570',

  // === CLOSE MATCHES (approved as-is) ===
  'The Witcher 3': '292030',
  'Dragon Age: Origins': '47810',
  'Mass Effect': '1328670', // Legendary Edition - user approved
  "Baldur's Gate 2": '257350',
  'State of Decay 2': '495420',
  'Crusader Kings 2': '203770',
  'Divinity: Original Sin 2': '435150',
  'Mass Effect 2': '2362420',
  'The Nonary Games': '477740',
  'FTL': '212680',
  'Dragon Age 2': '1238040',
  'Northgard': '466560',
  'Pathfinder: Kingmaker': '640820',
  'Persona 5': '1687950',
  'Mass Effect: Andromeda': '1238000',
  'Civilization 5': '8930',
  'Dark Souls 2': '335300',
  'Age of Wonders 3': '226840',
  'The Elder Scrolls V: Skyrim': '489830',
  'SimCity 4': '24780',
  'Eador: Masters of the Broken World': '232050',
  'Might & Magic: Clash of Heroes': '2213300',

  // === CORRECTED MATCHES ===
  'Life is Strange': '319630', // Original, not LiS 2
  'Endless Space': '208140', // Original, not ES2
  'Europa Universalis': '236850', // EU IV (will also rename)
  'Persona 4': '1113000', // Golden
  'Reus': '222730', // Original, not Reus 2
  'Crysis': '1715130', // Remastered (original not on Steam)
  'Surviving Mars': '464920', // Original, not Relaunched
  'Horizon: Zero Dawn': '1151640', // Complete Edition, not Remastered
};

// Games that need name updates too
const NAME_UPDATES: Record<string, string> = {
  'Europa Universalis': 'Europa Universalis IV',
};

async function main() {
  console.log('Applying Steam IDs to games database...\n');

  let updated = 0;
  let renamed = 0;
  let notFound = 0;

  for (const [gameName, steamId] of Object.entries(STEAM_IDS)) {
    // Find the game
    const games = await db
      .select()
      .from(videoGames)
      .where(eq(videoGames.name, gameName));

    if (games.length === 0) {
      console.log(`  ✗ Not found: "${gameName}"`);
      notFound++;
      continue;
    }

    const game = games[0];

    // Check if we need to rename
    const newName = NAME_UPDATES[gameName];

    if (newName) {
      await db
        .update(videoGames)
        .set({
          steamAppId: steamId,
          name: newName,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(videoGames.id, game.id));
      console.log(`  ✓ ${gameName} → ${newName} (${steamId})`);
      renamed++;
    } else {
      await db
        .update(videoGames)
        .set({
          steamAppId: steamId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(videoGames.id, game.id));
      console.log(`  ✓ ${gameName} (${steamId})`);
    }

    updated++;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Updated: ${updated} games`);
  console.log(`Renamed: ${renamed} games`);
  console.log(`Not found: ${notFound} games`);

  // Show games still missing Steam IDs
  const remaining = await db
    .select({ name: videoGames.name })
    .from(videoGames)
    .where(eq(videoGames.steamAppId, null as unknown as string));

  if (remaining.length > 0) {
    console.log(`\nGames still without Steam IDs (${remaining.length}):`);
    for (const game of remaining) {
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
