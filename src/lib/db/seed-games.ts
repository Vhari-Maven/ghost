/**
 * Seed script to import video games from the archived document
 * Run with: npm run db:seed-games
 */

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { videoGames, type GameTier } from './schema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

const dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'ghost.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Game data parsed from static/archive/video-games.md
// sortOrder is per-tier, calculated during grouping
type GameSeed = {
  name: string;
  genre: string;
  tier: GameTier;
  releaseYear: number;
  comment?: string;
};

const GAMES: GameSeed[] = [
  // S-tier (9 games)
  { name: 'Factorio', genre: 'Sandbox Strategy', tier: 'S', releaseYear: 2016 },
  { name: 'Cataclysm: Dark Days Ahead', genre: 'Survival Roguelike', tier: 'S', releaseYear: 2013 },
  { name: 'World of Warcraft', genre: 'MMORPG', tier: 'S', releaseYear: 2004 },
  { name: 'The Witcher 3', genre: 'Action RPG', tier: 'S', releaseYear: 2015 },
  { name: 'Warcraft 3', genre: 'Real-Time Strategy', tier: 'S', releaseYear: 2002 },
  { name: 'Dragon Age: Origins', genre: 'Fantasy RPG', tier: 'S', releaseYear: 2009 },
  { name: 'Stellaris', genre: 'Grand Strategy', tier: 'S', releaseYear: 2016 },
  { name: 'Subnautica', genre: 'Survival Adventure', tier: 'S', releaseYear: 2018 },
  { name: 'Mass Effect', genre: 'Sci-Fi RPG', tier: 'S', releaseYear: 2007 },

  // A+ tier (9 games)
  { name: '7 Days to Die', genre: 'Survival Horror', tier: 'A+', releaseYear: 2013 },
  { name: 'XCOM 2', genre: 'Tactical Strategy', tier: 'A+', releaseYear: 2016 },
  { name: "Baldur's Gate 2", genre: 'Classic RPG', tier: 'A+', releaseYear: 2000 },
  { name: 'V Rising', genre: 'Action Survival', tier: 'A+', releaseYear: 2022 },
  { name: 'Life is Strange', genre: 'Adventure', tier: 'A+', releaseYear: 2015 },
  { name: 'Among Us', genre: 'Social Deduction', tier: 'A+', releaseYear: 2018 },
  { name: 'State of Decay 2', genre: 'Survival Strategy', tier: 'A+', releaseYear: 2018 },
  { name: 'Rimworld', genre: 'Colony Sim', tier: 'A+', releaseYear: 2018 },
  { name: 'XCOM: Enemy Unknown', genre: 'Tactical Strategy', tier: 'A+', releaseYear: 2012 },

  // A tier (23 games)
  { name: 'Starcraft 2', genre: 'Real-Time Strategy', tier: 'A', releaseYear: 2010 },
  { name: 'Crusader Kings 2', genre: 'Grand Strategy', tier: 'A', releaseYear: 2012 },
  { name: 'Kerbal Space Program', genre: 'Simulation', tier: 'A', releaseYear: 2015 },
  { name: 'Starsector', genre: 'Space RPG', tier: 'A', releaseYear: 2013, comment: 'In progress' },
  { name: 'Terraria', genre: 'Sandbox Adventure', tier: 'A', releaseYear: 2011 },
  { name: 'Subterrain', genre: 'Survival Adventure', tier: 'A', releaseYear: 2016 },
  { name: 'Distant Worlds: Universe', genre: 'Space Strategy', tier: 'A', releaseYear: 2014 },
  { name: 'Cyberpunk 2077', genre: 'Open-World RPG', tier: 'A', releaseYear: 2020 },
  { name: 'Divinity: Original Sin 2', genre: 'Tactical RPG', tier: 'A', releaseYear: 2017 },
  { name: 'Mass Effect 2', genre: 'Sci-Fi RPG', tier: 'A', releaseYear: 2010 },
  { name: 'Anno 2070', genre: 'City-Building Strategy', tier: 'A', releaseYear: 2011 },
  { name: 'Surviving Mars', genre: 'City-Building Simulation', tier: 'A', releaseYear: 2018 },
  { name: 'I Was a Teenage Exocolonist', genre: 'Visual Novel RPG', tier: 'A', releaseYear: 2022 },
  { name: 'Thea: The Awakening', genre: 'Strategy RPG', tier: 'A', releaseYear: 2015 },
  { name: 'The Last Spell', genre: 'Tactical RPG', tier: 'A', releaseYear: 2021 },
  { name: 'Battle Brothers', genre: 'Tactical Strategy', tier: 'A', releaseYear: 2017 },
  { name: 'Valheim', genre: 'Survival Crafting', tier: 'A', releaseYear: 2021 },
  { name: 'Slay the Spire', genre: 'Card Strategy', tier: 'A', releaseYear: 2019 },
  { name: 'Dying Light', genre: 'Survival Horror', tier: 'A', releaseYear: 2015 },
  { name: 'The Nonary Games', genre: 'Puzzle Adventure', tier: 'A', releaseYear: 2017 },
  { name: 'Metal Gear Solid V: The Phantom Pain', genre: 'Action Stealth', tier: 'A', releaseYear: 2015 },
  { name: 'FTL', genre: 'Roguelike Strategy', tier: 'A', releaseYear: 2012 },
  { name: 'Heat Signature', genre: 'Stealth Action', tier: 'A', releaseYear: 2017 },

  // A- tier (5 games)
  { name: 'Dragon Age 2', genre: 'Fantasy RPG', tier: 'A-', releaseYear: 2011 },
  { name: 'Starcraft', genre: 'Real-Time Strategy', tier: 'A-', releaseYear: 1998 },
  { name: 'Barotrauma', genre: 'Survival Co-op', tier: 'A-', releaseYear: 2019 },
  { name: 'Portal 2', genre: 'Puzzle Adventure', tier: 'A-', releaseYear: 2011 },
  { name: 'This War of Mine', genre: 'Survival Simulation', tier: 'A-', releaseYear: 2014 },

  // B+ tier (9 games)
  { name: 'Space Engineers', genre: 'Sandbox Simulation', tier: 'B+', releaseYear: 2019, comment: 'In progress' },
  { name: 'Diablo 3', genre: 'Action RPG', tier: 'B+', releaseYear: 2012 },
  { name: 'Orb of Creation', genre: 'Puzzle Adventure', tier: 'B+', releaseYear: 2022 },
  { name: 'Northgard', genre: 'Real-Time Strategy', tier: 'B+', releaseYear: 2018 },
  { name: "No Man's Sky", genre: 'Exploration Adventure', tier: 'B+', releaseYear: 2016 },
  { name: "Baldur's Gate 3", genre: 'Fantasy RPG', tier: 'B+', releaseYear: 2023 },
  { name: 'Pathfinder: Kingmaker', genre: 'Fantasy RPG', tier: 'B+', releaseYear: 2018 },
  { name: 'Bitburner', genre: 'Hacking Sim', tier: 'B+', releaseYear: 2019 },
  { name: 'Shogun Showdown', genre: 'Tactical Strategy', tier: 'B+', releaseYear: 2023 },

  // B tier (20 games)
  { name: 'Across the Obelisk', genre: 'Deck-Building Roguelike', tier: 'B', releaseYear: 2021 },
  { name: 'Renowned Explorers: International Society', genre: 'Strategy Adventure', tier: 'B', releaseYear: 2015 },
  { name: 'Dig or Die', genre: 'Survival Sandbox', tier: 'B', releaseYear: 2015 },
  { name: 'Space Pirates and Zombies', genre: 'Space Shooter', tier: 'B', releaseYear: 2011 },
  { name: 'Rebel Galaxy', genre: 'Space RPG', tier: 'B', releaseYear: 2015 },
  { name: 'Endless Space', genre: 'Space Strategy', tier: 'B', releaseYear: 2012 },
  { name: 'Warhammer: Vermintide 2', genre: 'Action Co-op', tier: 'B', releaseYear: 2018 },
  { name: 'Roadwarden', genre: 'Interactive Fiction RPG', tier: 'B', releaseYear: 2022 },
  { name: 'Lethal Company', genre: 'Action Strategy', tier: 'B', releaseYear: 2023 },
  { name: 'Europa Universalis', genre: 'Grand Strategy', tier: 'B', releaseYear: 2000 },
  { name: 'Horizon: Zero Dawn', genre: 'Action RPG', tier: 'B', releaseYear: 2017 },
  { name: 'Persona 4', genre: 'JRPG', tier: 'B', releaseYear: 2008 },
  { name: 'Persona 5', genre: 'JRPG', tier: 'B', releaseYear: 2016 },
  { name: 'Book of Hours', genre: 'Narrative Adventure', tier: 'B', releaseYear: 2023, comment: 'In progress' },
  { name: 'Cultist Simulator', genre: 'Narrative Strategy', tier: 'B', releaseYear: 2018 },
  { name: 'Apex Legends', genre: 'Battle Royale', tier: 'B', releaseYear: 2019 },
  { name: 'Against the Storm', genre: 'City-Building Roguelike', tier: 'B', releaseYear: 2023 },
  { name: 'CrossCode', genre: 'Action RPG', tier: 'B', releaseYear: 2018 },
  { name: 'Star Realms', genre: 'Card Strategy', tier: 'B', releaseYear: 2014 },
  { name: 'Warlock: Master of the Arcane', genre: 'Fantasy Strategy', tier: 'B', releaseYear: 2012 },

  // B- tier (19 games)
  { name: 'Duskers', genre: 'Sci-Fi Strategy', tier: 'B-', releaseYear: 2016 },
  { name: 'Mindustry', genre: 'Tower Defense Sandbox', tier: 'B-', releaseYear: 2019 },
  { name: 'Mass Effect: Andromeda', genre: 'Sci-Fi RPG', tier: 'B-', releaseYear: 2017 },
  { name: 'Oxygen Not Included', genre: 'Survival Simulation', tier: 'B-', releaseYear: 2019 },
  { name: 'Reus', genre: 'God Game', tier: 'B-', releaseYear: 2013 },
  { name: 'Prismata', genre: 'Strategy Card Game', tier: 'B-', releaseYear: 2018 },
  { name: 'Crysis', genre: 'First-Person Shooter', tier: 'B-', releaseYear: 2007 },
  { name: 'The Long Dark', genre: 'Survival Simulation', tier: 'B-', releaseYear: 2014 },
  { name: 'Diablo 2', genre: 'Action RPG', tier: 'B-', releaseYear: 2000 },
  { name: 'Civilization 5', genre: 'Turn-Based Strategy', tier: 'B-', releaseYear: 2010 },
  { name: 'Monster Train', genre: 'Card Strategy', tier: 'B-', releaseYear: 2020 },
  { name: 'Dragon Age: Inquisition', genre: 'Fantasy RPG', tier: 'B-', releaseYear: 2014 },
  { name: 'The Sims 4', genre: 'Life Simulation', tier: 'B-', releaseYear: 2014 },
  { name: "Don't Starve", genre: 'Survival Adventure', tier: 'B-', releaseYear: 2013 },
  { name: 'Starbound', genre: 'Sandbox Adventure', tier: 'B-', releaseYear: 2016 },
  { name: 'Dark Souls 2', genre: 'Action RPG', tier: 'B-', releaseYear: 2014 },
  { name: 'They Are Billions', genre: 'Real-Time Strategy', tier: 'B-', releaseYear: 2019 },
  { name: 'Age of Wonders 3', genre: 'Strategy RPG', tier: 'B-', releaseYear: 2014 },
  { name: 'The Walking Dead', genre: 'Adventure', tier: 'B-', releaseYear: 2012 },

  // C+ tier (4 games)
  { name: 'Tales of Berseria', genre: 'JRPG', tier: 'C+', releaseYear: 2016 },
  { name: 'The Elder Scrolls V: Skyrim', genre: 'Open-World RPG', tier: 'C+', releaseYear: 2011 },
  { name: 'SimCity 4', genre: 'City-Building Simulation', tier: 'C+', releaseYear: 2003 },
  { name: "Assassin's Creed: Odyssey", genre: 'Action Adventure', tier: 'C+', releaseYear: 2018 },

  // C tier (8 games)
  { name: 'Hearthstone', genre: 'Digital Card Game', tier: 'C', releaseYear: 2014 },
  { name: 'Kingdoms of Amalur: Reckoning', genre: 'Action RPG', tier: 'C', releaseYear: 2012 },
  { name: 'Salt and Sanctuary', genre: 'Action RPG', tier: 'C', releaseYear: 2016 },
  { name: 'Pillars of Eternity', genre: 'Fantasy RPG', tier: 'C', releaseYear: 2015 },
  { name: 'Eador: Masters of the Broken World', genre: 'Turn-Based Strategy', tier: 'C', releaseYear: 2013 },
  { name: 'DOTA 2', genre: 'MOBA', tier: 'C', releaseYear: 2013 },
  { name: 'Might & Magic: Clash of Heroes', genre: 'Puzzle Strategy', tier: 'C', releaseYear: 2009 },
  { name: 'Adventure Capitalist', genre: 'Idle Game', tier: 'C', releaseYear: 2014 },
];

async function seed() {
  console.log('Seeding video games...');
  console.log(`Database path: ${dbPath}`);

  // Group games by tier to calculate sortOrder
  const tierCounts: Record<string, number> = {};

  const gamesToInsert = GAMES.map((game) => {
    const currentOrder = tierCounts[game.tier] ?? 0;
    tierCounts[game.tier] = currentOrder + 1;

    return {
      name: game.name,
      genre: game.genre,
      tier: game.tier,
      releaseYear: game.releaseYear,
      comment: game.comment ?? null,
      steamAppId: null,
      sortOrder: currentOrder,
    };
  });

  // Clear existing games
  await db.delete(videoGames);
  console.log('Cleared existing games');

  // Insert all games
  await db.insert(videoGames).values(gamesToInsert);
  console.log(`Inserted ${gamesToInsert.length} games`);

  // Summary
  console.log('\nGames per tier:');
  for (const tier of ['S', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C']) {
    const count = tierCounts[tier] ?? 0;
    console.log(`  ${tier}: ${count}`);
  }

  console.log('\nSeeding complete!');
  sqlite.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
