<script lang="ts">
  import Accordion from '$lib/components/Accordion.svelte';
</script>

<div class="max-w-4xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold flex items-center gap-3">
      <span class="text-3xl">🥗</span>
      Meal Prep Plan
    </h1>
    <span class="text-sm text-[var(--color-text-muted)]">Heart-Healthy Weight Management</span>
  </div>

  <!-- Quick Stats Banner -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
    <div class="bg-[var(--color-surface)] rounded-lg p-3 text-center border border-[var(--color-border)]">
      <div class="text-2xl font-bold text-[var(--color-accent)]">~1,625</div>
      <div class="text-xs text-[var(--color-text-muted)]">Daily Calories</div>
    </div>
    <div class="bg-[var(--color-surface)] rounded-lg p-3 text-center border border-[var(--color-border)]">
      <div class="text-2xl font-bold text-[var(--color-accent)]">~125g</div>
      <div class="text-xs text-[var(--color-text-muted)]">Daily Protein</div>
    </div>
    <div class="bg-[var(--color-surface)] rounded-lg p-3 text-center border border-[var(--color-border)]">
      <div class="text-2xl font-bold text-[var(--color-accent)]">~24g</div>
      <div class="text-xs text-[var(--color-text-muted)]">Daily Fiber</div>
    </div>
    <div class="bg-[var(--color-surface)] rounded-lg p-3 text-center border border-[var(--color-border)]">
      <div class="text-2xl font-bold text-[var(--color-accent)]">170 lbs</div>
      <div class="text-xs text-[var(--color-text-muted)]">Target Weight</div>
    </div>
  </div>

  <!-- Overview -->
  <Accordion title="Overview & Goals" icon="🎯" defaultOpen={true}>
    <div class="space-y-4">
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <h3 class="font-semibold text-[var(--color-accent)] mb-2">Current Stats</h3>
          <ul class="text-sm space-y-1 text-[var(--color-text-muted)]">
            <li>38 years old, 5'9", 180 lbs</li>
            <li>Target: ~170 lbs</li>
            <li>Daily activity: 25 min incline treadmill (5% grade, 3.8 mph)</li>
            <li>Supplements: Vitamin D 2000 IU daily</li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold text-[var(--color-accent)] mb-2">Lipid Goals</h3>
          <ul class="text-sm space-y-1 text-[var(--color-text-muted)]">
            <li>Raise HDL: 32 → >39</li>
            <li>Lower LDL: 114 → &lt;100</li>
          </ul>
        </div>
      </div>
      <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
        <span class="text-[var(--color-accent)] font-medium">Calorie Breakdown:</span>
        <span class="text-[var(--color-text-muted)]"> Maintenance ~2,150 cal/day → Target ~1,625 cal/day (500 cal deficit)</span>
      </div>
    </div>
  </Accordion>

  <!-- Standard Breakfast -->
  <Accordion title="Standard Breakfast" icon="🍳">
    <div class="space-y-4">
      <p class="text-[var(--color-text-muted)] text-sm italic">Same every day — ~925 calories</p>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--color-border)]">
              <th class="text-left py-2 text-[var(--color-text-muted)]">Item</th>
              <th class="text-right py-2 text-[var(--color-text-muted)]">Calories</th>
            </tr>
          </thead>
          <tbody class="text-[var(--color-text)]">
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">2 slices whole wheat bread</td>
              <td class="text-right">160</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">2 tbsp crunchy peanut butter</td>
              <td class="text-right">190</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">2 tbsp grape jam</td>
              <td class="text-right">100</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">4 oz orange juice</td>
              <td class="text-right">55</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">12 oz 2% milk + 60g whey protein</td>
              <td class="text-right">420</td>
            </tr>
            <tr class="font-semibold text-[var(--color-accent)]">
              <td class="py-2">Total</td>
              <td class="text-right">~925</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
        <span class="text-[var(--color-accent)] font-medium">Macros:</span>
        <span class="text-[var(--color-text-muted)]"> ~76g protein, ~90g carbs, ~32g fat, ~6g fiber</span>
      </div>
    </div>
  </Accordion>

  <!-- Weeknight Dinners -->
  <Accordion title="Weeknight Dinners (Mon–Fri)" icon="🍽️">
    <div class="space-y-4">
      <p class="text-[var(--color-text-muted)] text-sm italic">~700–750 calories | Prep time: &lt;15 minutes using batch-prepped ingredients</p>

      <h3 class="font-semibold text-[var(--color-accent)]">Air Fryer Salmon + Roasted Vegetables + Lentils</h3>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-[var(--color-border)]">
              <th class="text-left py-2 text-[var(--color-text-muted)]">Component</th>
              <th class="text-left py-2 text-[var(--color-text-muted)]">Portion</th>
              <th class="text-right py-2 text-[var(--color-text-muted)]">Calories</th>
            </tr>
          </thead>
          <tbody class="text-[var(--color-text)]">
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">Salmon fillet</td>
              <td class="py-2">6 oz</td>
              <td class="text-right">~350</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">Roasted vegetables</td>
              <td class="py-2">1.5 cups (with olive oil)</td>
              <td class="text-right">~120</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">Cooked lentils</td>
              <td class="py-2">¾ cup</td>
              <td class="text-right">~170</td>
            </tr>
            <tr class="border-b border-[var(--color-border)]/50">
              <td class="py-2">Bagged salad (optional)</td>
              <td class="py-2">1 cup with light dressing</td>
              <td class="text-right">~60</td>
            </tr>
            <tr class="font-semibold text-[var(--color-accent)]">
              <td class="py-2">Total</td>
              <td class="py-2"></td>
              <td class="text-right">~700</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
        <span class="text-[var(--color-accent)] font-medium">Dinner Macros:</span>
        <span class="text-[var(--color-text-muted)]"> ~50g protein, ~45g carbs, ~20g fat, ~12g fiber</span>
      </div>
    </div>
  </Accordion>

  <!-- Weekend Meals -->
  <Accordion title="Weekend Meals (Sat–Sun)" icon="📅">
    <div class="space-y-6">
      <!-- Saturday -->
      <div>
        <h3 class="font-semibold text-[var(--color-accent)] mb-3">Saturday</h3>
        <div class="space-y-4 ml-4">
          <div>
            <h4 class="font-medium text-[var(--color-text)]">Breakfast: Standard (~825 cal)</h4>
          </div>

          <div>
            <h4 class="font-medium text-[var(--color-text)] mb-2">Lunch: Mediterranean Bowl (~450 cal)</h4>
            <ul class="text-sm text-[var(--color-text-muted)] space-y-1 ml-4">
              <li>1 cup cooked quinoa (220 cal)</li>
              <li>½ cup chickpeas, drained (120 cal)</li>
              <li>1 cup mixed greens + cucumber + tomato (30 cal)</li>
              <li>1 tbsp olive oil + lemon juice (80 cal)</li>
            </ul>
          </div>

          <div>
            <h4 class="font-medium text-[var(--color-text)] mb-2">Dinner: Lighter Salmon Plate (~500 cal)</h4>
            <p class="text-sm text-[var(--color-text-muted)] ml-4">Same as weeknight but smaller: 5 oz salmon, 1 cup vegetables, ½ cup lentils</p>
          </div>
        </div>
      </div>

      <!-- Sunday -->
      <div>
        <h3 class="font-semibold text-[var(--color-accent)] mb-3">Sunday</h3>
        <div class="space-y-4 ml-4">
          <div>
            <h4 class="font-medium text-[var(--color-text)]">Breakfast: Standard (~825 cal)</h4>
          </div>

          <div>
            <h4 class="font-medium text-[var(--color-text)] mb-2">Lunch: Bean & Vegetable Soup (~400 cal)</h4>
            <p class="text-sm text-[var(--color-text-muted)] ml-4">2 cups soup with crusty bread — pull from freezer stash (made during monthly batch)</p>
          </div>

          <div>
            <h4 class="font-medium text-[var(--color-text)]">Dinner: Batch prep time — eat leftovers or lighter meal</h4>
          </div>
        </div>
      </div>

      <!-- Daily Summary -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Daily Nutrition Summary</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)]">Metric</th>
                <th class="text-center py-2 text-[var(--color-text-muted)]">Weekday</th>
                <th class="text-center py-2 text-[var(--color-text-muted)]">Weekend</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Calories</td>
                <td class="text-center">~1,625</td>
                <td class="text-center">~1,775–1,875</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Protein</td>
                <td class="text-center">~125g</td>
                <td class="text-center">~115g</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Fiber</td>
                <td class="text-center">~24g</td>
                <td class="text-center">~28g</td>
              </tr>
              <tr>
                <td class="py-2">Omega-3s</td>
                <td class="text-center">~2.5g (from salmon)</td>
                <td class="text-center">~2g</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Accordion>

  <!-- Sunday Batch Prep -->
  <Accordion title="Sunday Batch Prep (90–120 min)" icon="⏱️">
    <div class="space-y-4">
      <ol class="space-y-4">
        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">1</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Start lentils in Instant Pot</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (5 min active, 25 min cook)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">2 cups dry green/brown lentils + 4 cups water + pinch salt. Pressure cook 12 minutes, natural release 10 min.</p>
          </div>
        </li>

        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">2</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Prep vegetables for roasting</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (15 min)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Cut into 1-inch pieces.</p>
          </div>
        </li>

        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">3</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Roast vegetables</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (5 min active, 35 min cook)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Toss with 2 tbsp olive oil + salt + pepper. Spread on 2 sheet pans. Roast at 425°F for 35 minutes, stirring halfway.</p>
          </div>
        </li>

        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">4</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Portion salmon</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (5 min)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Divide into 6 oz portions, wrap individually, refrigerate.</p>
          </div>
        </li>

        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">5</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Bean soup (monthly — not every week)</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (10 min active, 20 min cook)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Sauté onion + garlic + carrots, add beans + broth + tomatoes + spinach. Pressure cook 15 min. Portion into 2-cup containers and freeze — makes ~4 weeks of Sunday lunches.</p>
          </div>
        </li>

        <li class="flex gap-3">
          <span class="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--color-accent)] text-white text-sm flex items-center justify-center font-bold">6</span>
          <div>
            <span class="font-medium text-[var(--color-text)]">Portion and store everything</span>
            <span class="text-[var(--color-text-muted)] text-sm"> (10 min)</span>
            <p class="text-sm text-[var(--color-text-muted)] mt-1">Lentils and vegetables in fridge containers. Soup goes in freezer (on soup-making weeks).</p>
          </div>
        </li>
      </ol>

      <!-- Vegetable Mix -->
      <div class="bg-[var(--color-surface)] rounded p-4 mt-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Vegetable Roasting Mix</h4>
        <p class="text-sm text-[var(--color-text-muted)] mb-2">Choose 3–4 from this rotation (all reheat well):</p>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div><span class="text-[var(--color-accent)]">🥦</span> Broccoli — High fiber</div>
          <div><span class="text-[var(--color-accent)]">🫑</span> Bell peppers — Sweet, colorful</div>
          <div><span class="text-[var(--color-accent)]">🥒</span> Zucchini/Squash — Mild</div>
          <div><span class="text-[var(--color-accent)]">🥬</span> Brussels sprouts — Crispy</div>
          <div><span class="text-[var(--color-accent)]">🥕</span> Carrots — Sweet roasted</div>
          <div><span class="text-[var(--color-accent)]">🧅</span> Red onion — Caramelizes</div>
        </div>
        <p class="text-sm text-[var(--color-text)] mt-3"><strong>Recommended combo:</strong> Broccoli + bell peppers + zucchini + red onion</p>
      </div>
    </div>
  </Accordion>

  <!-- Air Fryer Salmon Recipe -->
  <Accordion title="Foolproof Air Fryer Salmon" icon="🐟">
    <div class="space-y-4">
      <p class="text-[var(--color-text-muted)] text-sm italic">
        The air fryer's circulating heat cooks salmon evenly and quickly. A meat thermometer removes all guesswork.
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Ingredients -->
        <div>
          <h4 class="font-medium text-[var(--color-accent)] mb-2">Ingredients (per serving)</h4>
          <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>6 oz salmon fillet (skin-on or skinless)</li>
            <li>½ tsp olive oil</li>
            <li>Garlic salt and pepper to taste</li>
            <li>Optional: lemon wedge, fresh dill</li>
          </ul>
        </div>

        <!-- Instructions -->
        <div>
          <h4 class="font-medium text-[var(--color-accent)] mb-2">Instructions</h4>
          <ol class="text-sm text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
            <li><strong>Preheat</strong> air fryer to 390°F (about 3 min)</li>
            <li><strong>Pat salmon completely dry</strong> with paper towels — crucial for texture</li>
            <li><strong>Rub with olive oil</strong>, season generously with garlic salt and pepper</li>
            <li><strong>Place skin-side down</strong> in air fryer basket</li>
            <li><strong>Cook 7–8 minutes</strong> for 1-inch thick fillets. Do not flip.</li>
            <li><strong>Check internal temp</strong> at thickest part: Target 125–130°F</li>
            <li><strong>Rest 2 minutes</strong> before serving</li>
          </ol>
        </div>
      </div>

      <!-- Temperature Guide -->
      <div class="bg-[var(--color-surface)] rounded p-4 mt-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Temperature Guide</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)]">Doneness</th>
                <th class="text-center py-2 text-[var(--color-text-muted)]">Pull Temp</th>
                <th class="text-center py-2 text-[var(--color-text-muted)]">Final Temp</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Medium-rare</td>
                <td class="text-center">120°F</td>
                <td class="text-center">125°F</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50 bg-[var(--color-accent)]/10">
                <td class="py-2 font-medium">Medium (recommended)</td>
                <td class="text-center">125–130°F</td>
                <td class="text-center">130–135°F</td>
              </tr>
              <tr>
                <td class="py-2">Medium-well</td>
                <td class="text-center">135°F</td>
                <td class="text-center">140°F</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="text-xs text-[var(--color-text-muted)] mt-2 italic">
          Most home cooks overcook salmon to 145°F+, which makes it dry and chalky. Pull at 125–130°F for restaurant-quality results.
        </p>
      </div>
    </div>
  </Accordion>

  <!-- Grocery List -->
  <Accordion title="Weekly Grocery List" icon="🛒">
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Proteins -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Proteins</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Salmon fillets — 2.5 lbs (for 6–7 dinners)</li>
          <li>Whey protein powder — per your current supply</li>
        </ul>
      </div>

      <!-- Produce -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Produce</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Broccoli — 2 large heads</li>
          <li>Bell peppers — 4 (mixed colors)</li>
          <li>Zucchini — 3 medium</li>
          <li>Red onion — 2</li>
          <li>Carrots — 1 lb bag</li>
          <li>Spinach — 1 bag (for soup, monthly)</li>
          <li>Cucumber — 1</li>
          <li>Tomatoes — 2</li>
          <li>Mixed greens — 1 container</li>
          <li>Lemons — 2</li>
          <li>Garlic — 1 head</li>
          <li>Yellow onion — 1 (for soup, monthly)</li>
        </ul>
      </div>

      <!-- Pantry -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Pantry/Dry Goods</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Green or brown lentils — 2 cups dry</li>
          <li>Quinoa — 1 cup dry</li>
          <li>Canned chickpeas — 1 can (15 oz)</li>
          <li>Canned white beans — 2 cans (15 oz) <span class="text-[var(--color-text-muted)]">(monthly, for soup)</span></li>
          <li>Canned diced tomatoes — 1 can (14 oz) <span class="text-[var(--color-text-muted)]">(monthly, for soup)</span></li>
          <li>Vegetable or chicken broth — 4 cups <span class="text-[var(--color-text-muted)]">(monthly, for soup)</span></li>
          <li>Whole wheat bread — 1 loaf</li>
          <li>Olive oil — per your current supply</li>
        </ul>
      </div>

      <!-- Dairy/Refrigerated -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Dairy/Refrigerated</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>2% milk — 1 gallon</li>
          <li>Orange juice — 1 small bottle</li>
          <li>Crunchy peanut butter — per your current supply</li>
          <li>Grape jam — per your current supply</li>
        </ul>
      </div>
    </div>
  </Accordion>

  <!-- Kitchen Tips -->
  <Accordion title="Practical Kitchen Tips" icon="🔪">
    <div class="space-y-6">
      <!-- Weeknight Workflow -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Weeknight Salmon Workflow</h4>
        <p class="text-sm text-[var(--color-text-muted)] mb-2">Salmon is cooked fresh each night—not batch prepped. Total time: ~10 minutes.</p>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1 ml-4">
          <li><strong>Night before (or morning):</strong> Move one salmon fillet from freezer to fridge to thaw</li>
          <li><strong>Same-day thaw option:</strong> Sealed bag in cold water for 20–30 min (weigh down with a plate)</li>
          <li><strong>When ready to cook:</strong> Preheat air fryer (3 min), season salmon, cook (7–8 min)</li>
          <li><strong>While salmon cooks:</strong> Microwave pre-portioned lentils and vegetables</li>
        </ul>
      </div>

      <!-- Vegetable Cutting Tips -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Vegetable Cutting Tips</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-[var(--color-text-muted)]">
          <div>
            <strong class="text-[var(--color-text)]">Bell peppers:</strong> Cut off top and bottom, slice down one side to open flat, remove seeds/ribs in one piece, then cut into chunks.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Zucchini:</strong> Cut off ends, slice lengthwise down the middle, cut each half into ½-inch half-moons.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Broccoli:</strong> Cut where florets branch off from stem. If florets are huge, cut in half. Discard thick woody stem.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Red onion:</strong> Cut off ends, slice in half through root, peel skin, lay flat and cut into wedges like pizza slices.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Garlic:</strong> Smash clove with flat side of knife—papery skin slides right off. Then chop.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Lemon juice:</strong> Cut in half, jab a fork into the cut side and twist while squeezing.
          </div>
        </div>
      </div>

      <!-- Roasting Tips -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Roasting Vegetables</h4>
        <ol class="text-sm text-[var(--color-text-muted)] space-y-1 list-decimal list-inside">
          <li>Preheat oven to 425°F</li>
          <li>Toss vegetables with olive oil (~1 tbsp per sheet pan), salt, and pepper—easiest with your hands</li>
          <li>Spread in single layer with space between pieces—don't crowd or they'll steam instead of roast</li>
          <li>Roast 35 minutes total, stir/flip at the halfway mark (~17 min)</li>
          <li>Look for browned edges and tender (not mushy) texture</li>
        </ol>
      </div>

      <!-- Instant Pot Lentils -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Instant Pot Lentils</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Use green or brown lentils (red lentils turn to mush)</li>
          <li>2 cups dry lentils + 4 cups water + pinch of salt (3–4 shakes from shaker)</li>
          <li>High pressure 12 minutes, natural release 10 minutes</li>
          <li>Drain in strainer when done</li>
        </ul>
      </div>

      <!-- Food Safety -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Food Safety & Storage</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-[var(--color-text-muted)]">
          <div>
            <strong class="text-[var(--color-text)]">Raw salmon handling:</strong> Cut vegetables first, then handle salmon, then wash cutting board with hot soapy water
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Cooked lentils:</strong> 5 days in fridge
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Roasted vegetables:</strong> 4–5 days in fridge
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Raw salmon (thawed):</strong> Use within 2 days
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Cooked salmon:</strong> 3 days in fridge
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Produce storage:</strong> Fridge for salad greens, cucumber, carrots, lemons, tomatoes. Counter for yellow onion, garlic.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Frozen soup:</strong> 3–4 months in freezer. Thaw overnight in fridge or microwave from frozen.
          </div>
        </div>
      </div>

      <!-- Reheating -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Reheating</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li><strong>Vegetables:</strong> Air fryer 3–4 min at 350°F (best), or oven, or microwave (softer texture)</li>
          <li><strong>Lentils:</strong> Microwave—add a splash of water if dried out</li>
          <li><strong>Frozen soup:</strong> Thaw overnight, then stovetop or microwave. Or microwave from frozen in 2-min bursts, stirring between.</li>
        </ul>
      </div>
    </div>
  </Accordion>

  <!-- Adjustments -->
  <Accordion title="Notes & Adjustments" icon="⚙️">
    <div class="space-y-4">
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">If weight loss stalls</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Reduce salmon portion to 5 oz (~60 cal savings)</li>
          <li>Cut OJ entirely (~55 cal savings)</li>
          <li>Reduce peanut butter to 1.5 tbsp (~50 cal savings)</li>
        </ul>
      </div>

      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">If you're too hungry</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Add more vegetables (low calorie, high volume)</li>
          <li>Increase lentils to 1 cup (~50 cal more)</li>
          <li>Consider adding a small lunch (200–300 cal) on particularly hungry days</li>
        </ul>
      </div>

      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">For variety (optional)</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li>Swap salmon for mackerel or sardines 1–2x/week (similar omega-3s)</li>
          <li>Try different seasonings: lemon-herb, Cajun, teriyaki glaze</li>
          <li>Rotate vegetable mix weekly</li>
        </ul>
      </div>
    </div>
  </Accordion>

  <!-- Footer -->
  <div class="text-center text-sm text-[var(--color-text-muted)] mt-6 pb-4">
    Created: December 2025 | Review and adjust after lipid panel results
  </div>
</div>
