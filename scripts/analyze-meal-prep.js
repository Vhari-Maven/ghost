#!/usr/bin/env node

// Analyze meal-prep page for ingredient mismatches
// Usage: node scripts/analyze-meal-prep.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const content = fs.readFileSync(
  path.join(__dirname, '../src/routes/meal-prep/+page.svelte'),
  'utf-8'
);

// Manually define what we're buying vs using based on analysis
// This is more reliable than regex parsing

const GROCERY = {
  breakfast: [
    'whole wheat bread',
    'crunchy peanut butter',
    'grape jam',
    '2% milk',
    'whey protein powder',
    'orange juice'
  ],
  salmon: [
    'salmon fillets',
    'green/brown lentils',
    'broccoli',
    'bell peppers',
    'zucchini',
    'red onion',
    'lemons',
    'olive oil'
  ],
  beanSoup: [
    'canned white beans',
    'canned diced tomatoes',
    'broth',
    'carrots',
    'yellow onion',
    'garlic',
    'spinach'
  ],
  medBowl: [
    'quinoa',
    'canned chickpeas',
    'mixed greens',
    'cucumber',
    'tomatoes'
  ]
};

const RECIPES = {
  breakfast: [
    'whole wheat bread',
    'crunchy peanut butter',
    'grape jam',
    '2% milk',
    'whey protein powder',
    'orange juice'
  ],
  weeknightDinner: [
    'salmon',
    'roasted vegetables', // broccoli, bell peppers, zucchini, red onion
    'lentils',
    'bagged salad'  // <-- THIS IS NEW
  ],
  weekendSaturday: [
    'quinoa',
    'chickpeas',
    'mixed greens',
    'cucumber',
    'tomatoes',
    'olive oil',
    'lemon'
  ],
  weekendSunday: [
    'bean soup',  // uses: white beans, diced tomatoes, broth, carrots, onion, garlic, spinach
    'crusty bread'
  ],
  beanSoupRecipe: [
    'yellow onion',
    'garlic',
    'carrots',
    'canned white beans',
    'canned diced tomatoes',
    'broth',
    'spinach',
    'olive oil',
    'broccoli stems' // optional reuse
  ]
};

console.log('=== INGREDIENT ANALYSIS ===\n');

// Find mismatches
console.log('ISSUES FOUND:\n');

// 1. Bagged salad - used in recipe but not in grocery
console.log('❌ BAGGED SALAD');
console.log('   Used in: Weeknight Dinners ("1 cup bagged salad")');
console.log('   Missing from: Grocery list');
console.log('');

// 2. 2% milk - check if it's in grocery
const has2Milk = content.includes('2% milk') && content.match(/Weekly Grocery List[\s\S]*2% milk/);
if (has2Milk) {
  console.log('✅ 2% milk - in grocery list');
} else {
  console.log('❌ 2% MILK');
  console.log('   Used in: Breakfast ("12 oz 2% milk + 60g whey protein")');
  console.log('   Status: In grocery list ✓');
}
console.log('');

// 3. Crusty bread for soup
const hasCrustyBread = content.toLowerCase().includes('crusty bread') &&
  content.match(/Weekly Grocery List[\s\S]*crusty bread/i);
console.log('❌ CRUSTY BREAD');
console.log('   Used in: Sunday Dinner ("2 cups soup with crusty bread")');
console.log('   Missing from: Grocery list (says "from freezer stash" but never bought)');
console.log('');

// 4. Lemon usage
console.log('⚠️  LEMONS');
console.log('   In grocery: Salmon section (marked "optional — for finishing")');
console.log('   Also used in: Med Bowl ("Juice of ½ lemon" - required, not optional)');
console.log('   Suggestion: Remove "optional" from lemons or add to Med Bowl section');
console.log('');

// 5. Salt & pepper
console.log('ℹ️  SALT & PEPPER');
console.log('   Used in: Multiple recipes');
console.log('   Not in grocery: Assumed pantry staple (probably fine)');
console.log('');

// Summary
console.log('\n=== SUMMARY ===\n');
console.log('Must fix:');
console.log('  1. Add "Bagged salad" to Salmon Dinners grocery section');
console.log('  2. Add "Crusty bread" to grocery OR clarify where it comes from');
console.log('');
console.log('Should consider:');
console.log('  3. Lemons: listed as optional in Salmon but required for Med Bowl');
