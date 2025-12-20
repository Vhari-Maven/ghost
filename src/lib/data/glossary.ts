// Exercise terminology glossary for beginners
// These terms get highlighted in instructions with hover definitions

export interface GlossaryTerm {
  term: string;
  definition: string;
  aliases?: string[]; // Other forms of the word to match
}

export const GLOSSARY: GlossaryTerm[] = [
  // Muscles
  {
    term: 'glutes',
    definition: 'Your butt muscles — the gluteus maximus, medius, and minimus.',
    aliases: ['glute', 'gluteus']
  },
  {
    term: 'quads',
    definition: 'The four muscles on the front of your thigh that extend your knee.',
    aliases: ['quad', 'quadriceps']
  },
  {
    term: 'hamstrings',
    definition: 'The muscles on the back of your thigh that bend your knee and extend your hip.',
    aliases: ['hamstring', 'hams']
  },
  {
    term: 'lats',
    definition: 'The large, wing-shaped muscles on your back that pull your arms down and back.',
    aliases: ['lat', 'latissimus dorsi']
  },
  {
    term: 'delts',
    definition: 'Your shoulder muscles — front, side, and rear deltoids.',
    aliases: ['delt', 'deltoids', 'deltoid']
  },
  {
    term: 'rear delts',
    definition: 'The back part of your shoulder muscle, important for posture and pulling movements.',
    aliases: ['rear delt', 'posterior deltoid']
  },
  {
    term: 'triceps',
    definition: 'The three-headed muscle on the back of your upper arm that straightens your elbow.',
    aliases: ['tricep', 'tris']
  },
  {
    term: 'biceps',
    definition: 'The muscle on the front of your upper arm that bends your elbow.',
    aliases: ['bicep', 'bis']
  },
  {
    term: 'core',
    definition: 'All the muscles around your midsection — abs, obliques, and lower back.',
  },
  {
    term: 'abs',
    definition: 'The abdominal muscles on the front of your stomach.',
    aliases: ['abdominals', 'abdominal']
  },
  {
    term: 'obliques',
    definition: 'The muscles on the sides of your torso that help you twist and bend sideways.',
    aliases: ['oblique']
  },
  {
    term: 'pecs',
    definition: 'Your chest muscles (pectoralis major and minor).',
    aliases: ['pec', 'pectorals', 'chest']
  },
  {
    term: 'rhomboids',
    definition: 'Muscles between your shoulder blades that squeeze them together.',
    aliases: ['rhomboid']
  },
  {
    term: 'rotator cuff',
    definition: 'Four small muscles that stabilize your shoulder joint.',
  },
  {
    term: 'hip flexors',
    definition: 'Muscles at the front of your hip that lift your knee up. Often tight from sitting.',
    aliases: ['hip flexor']
  },
  {
    term: 'calves',
    definition: 'The muscles on the back of your lower leg.',
    aliases: ['calf']
  },
  {
    term: 'traps',
    definition: 'The trapezius muscles that run from your neck to your mid-back.',
    aliases: ['trap', 'trapezius']
  },

  // Anatomy terms
  {
    term: 'shoulder blades',
    definition: 'The flat, triangular bones on your upper back (scapulae).',
    aliases: ['shoulder blade', 'scapula', 'scapulae']
  },
  {
    term: 'spine',
    definition: 'Your backbone — the column of vertebrae from neck to tailbone.',
    aliases: ['spinal']
  },
  {
    term: 'tailbone',
    definition: 'The small bone at the very bottom of your spine (coccyx).',
  },
  {
    term: 'pelvis',
    definition: 'The bowl-shaped bone structure at your hips.',
    aliases: ['pelvic']
  },
  {
    term: 'lower back',
    definition: 'The lumbar region of your spine, between your ribs and pelvis.',
  },

  // Movement terms
  {
    term: 'posterior pelvic tilt',
    definition: 'Tucking your tailbone under, flattening your lower back. Like a dog tucking its tail.',
  },
  {
    term: 'brace your core',
    definition: 'Tighten your midsection as if bracing for a punch — creates stability.',
    aliases: ['bracing', 'brace']
  },
  {
    term: 'retract',
    definition: 'Pull back — usually refers to squeezing shoulder blades together.',
    aliases: ['retraction']
  },
  {
    term: 'extend',
    definition: 'Straighten a joint (like straightening your arm or leg).',
    aliases: ['extension', 'extending']
  },
  {
    term: 'flex',
    definition: 'Bend a joint, or contract a muscle to make it shorter.',
    aliases: ['flexion', 'flexing']
  },
  {
    term: 'plantar flex',
    definition: 'Point your toes down, like pressing a gas pedal.',
    aliases: ['plantar flexion']
  },
  {
    term: 'dorsiflexion',
    definition: 'Pull your toes up toward your shin.',
    aliases: ['dorsiflex']
  },
  {
    term: 'supinate',
    definition: 'Rotate your palm to face up (like holding a bowl of soup).',
    aliases: ['supination']
  },
  {
    term: 'pronate',
    definition: 'Rotate your palm to face down.',
    aliases: ['pronation']
  },
  {
    term: 'lock out',
    definition: 'Fully straighten a joint. Often you want to avoid this under heavy load.',
    aliases: ['lockout', 'locking out']
  },
  {
    term: 'squeeze',
    definition: 'Contract a muscle hard at the end of a movement for maximum engagement.',
    aliases: ['squeezing']
  },
  {
    term: 'negative',
    definition: 'The lowering phase of an exercise, where the muscle lengthens under tension.',
    aliases: ['negatives', 'eccentric']
  },
  {
    term: 'range of motion',
    definition: 'How far a joint can move from start to finish of a movement.',
    aliases: ['ROM']
  },
  {
    term: 'momentum',
    definition: 'Using swinging or bouncing to move weight instead of controlled muscle contraction.',
  },

  // Form cues
  {
    term: 'neutral spine',
    definition: 'The natural S-curve of your spine — not overly arched or rounded.',
  },
  {
    term: 'chest up',
    definition: 'Lift your sternum and open your shoulders — prevents slouching.',
  },
  {
    term: 'shoulders back',
    definition: 'Pull your shoulders down and back, squeezing shoulder blades slightly together.',
  },
  {
    term: 'elbows in',
    definition: 'Keep your elbows close to your body rather than flaring out.',
    aliases: ['elbows tucked']
  },
  {
    term: 'knees cave',
    definition: 'When knees collapse inward during squats or leg press — avoid this!',
    aliases: ['knee cave', 'knees caving']
  },

  // Equipment
  // Note: Captain's Chair removed from glossary - now has photo in equipment.ts
  {
    term: 'cable',
    definition: 'A pulley system with adjustable height, providing constant tension.',
    aliases: ['cables']
  },
  {
    term: 'pulley',
    definition: 'The wheel system that redirects cable tension.',
  },
  {
    term: 'attachment',
    definition: 'Handle or bar that clips onto a cable machine (rope, straight bar, etc.).',
    aliases: ['attachments']
  },
  {
    term: 'pad',
    definition: 'Cushioned surface on a machine for support or positioning.',
  },
  {
    term: 'pin',
    definition: 'The metal rod you insert to select weight on a machine stack.',
    aliases: ['weight pin']
  },
  {
    term: 'EZ bar',
    definition: 'A curved barbell that puts your wrists in a more natural angle — easier on the joints.',
    aliases: ['EZ curl bar', 'ez bar']
  },
  {
    term: 'straight bar',
    definition: 'A standard straight barbell attachment for cable machines.',
  },
  {
    term: 'rope attachment',
    definition: 'A thick rope with knobs on the ends — attaches to cables for tricep pushdowns, face pulls, etc.',
    aliases: ['rope', 'tricep rope']
  },
  {
    term: 'weight stack',
    definition: 'The pile of rectangular weight plates on a machine — you select weight with a pin.',
  },
  {
    term: 'functional trainer',
    definition: 'A cable machine with two adjustable pulleys — very versatile for many exercises.',
  },
  {
    term: 'safety handles',
    definition: 'Levers you release to unlock the weight on machines like leg press.',
    aliases: ['safety bars', 'safety catches']
  },

  // Exercise types
  {
    term: 'compound',
    definition: 'An exercise that works multiple muscle groups and joints at once.',
    aliases: ['compound exercise', 'compound movement']
  },
  {
    term: 'isolation',
    definition: 'An exercise that targets one specific muscle group.',
    aliases: ['isolation exercise', 'isolation movement']
  },
  {
    term: 'superset',
    definition: 'Two exercises performed back-to-back with no rest between.',
  },
];

// Build a map for quick lookup
const glossaryMap = new Map<string, GlossaryTerm>();
GLOSSARY.forEach(entry => {
  glossaryMap.set(entry.term.toLowerCase(), entry);
  entry.aliases?.forEach(alias => {
    glossaryMap.set(alias.toLowerCase(), entry);
  });
});

export function getGlossaryTerm(word: string): GlossaryTerm | undefined {
  return glossaryMap.get(word.toLowerCase());
}

// Get all terms and aliases for regex matching
export function getAllTermPatterns(): string[] {
  const patterns: string[] = [];
  GLOSSARY.forEach(entry => {
    patterns.push(entry.term);
    entry.aliases?.forEach(alias => patterns.push(alias));
  });
  // Sort by length descending so longer phrases match first
  return patterns.sort((a, b) => b.length - a.length);
}
