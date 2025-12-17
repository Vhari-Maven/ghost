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

  <!-- Daily Meals -->
  <Accordion title="Daily Meals" icon="🍽️">
    <div class="space-y-6">
      <!-- Breakfast -->
      <div>
        <h3 class="font-semibold text-[var(--color-accent)] mb-3">Standard Breakfast (~925 cal)</h3>
        <p class="text-[var(--color-text-muted)] text-sm italic mb-3">Same every day</p>
        <div class="grid md:grid-cols-2 gap-4">
          <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>2 slices whole wheat bread (160 cal)</li>
            <li>2 tbsp crunchy peanut butter (190 cal)</li>
            <li>2 tbsp grape jam (100 cal)</li>
            <li>4 oz orange juice (55 cal)</li>
            <li>12 oz 2% milk + 60g whey protein (420 cal)</li>
          </ul>
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <span class="text-[var(--color-accent)] font-medium">Macros:</span>
            <span class="text-[var(--color-text-muted)]"> ~76g protein, ~90g carbs, ~32g fat, ~6g fiber</span>
          </div>
        </div>
      </div>

      <!-- Weeknight Dinners -->
      <div>
        <h3 class="font-semibold text-[var(--color-accent)] mb-3">Weeknight Dinners (~700 cal)</h3>
        <p class="text-[var(--color-text-muted)] text-sm italic mb-3">Mon–Fri: Air Fryer Salmon + Roasted Vegetables + Lentils</p>
        <div class="grid md:grid-cols-2 gap-4">
          <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>6 oz salmon fillet (~350 cal)</li>
            <li>1.5 cups roasted vegetables (~120 cal)</li>
            <li>¾ cup cooked lentils (~170 cal)</li>
            <li>Optional: 1 cup bagged salad (~60 cal)</li>
          </ul>
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <span class="text-[var(--color-accent)] font-medium">Macros:</span>
            <span class="text-[var(--color-text-muted)]"> ~50g protein, ~45g carbs, ~20g fat, ~12g fiber</span>
          </div>
        </div>
      </div>

      <!-- Weekend -->
      <div>
        <h3 class="font-semibold text-[var(--color-accent)] mb-3">Weekend Variations</h3>
        <div class="space-y-3 text-sm">
          <div>
            <span class="font-medium text-[var(--color-text)]">Saturday Lunch — Mediterranean Bowl (~450 cal):</span>
            <span class="text-[var(--color-text-muted)]"> 1 cup quinoa + ½ cup chickpeas + mixed greens + 1 tbsp olive oil & lemon</span>
          </div>
          <div>
            <span class="font-medium text-[var(--color-text)]">Saturday Dinner — Lighter Salmon (~500 cal):</span>
            <span class="text-[var(--color-text-muted)]"> 5 oz salmon, 1 cup vegetables, ½ cup lentils</span>
          </div>
          <div>
            <span class="font-medium text-[var(--color-text)]">Sunday Lunch — Bean Soup (~400 cal):</span>
            <span class="text-[var(--color-text-muted)]"> 2 cups soup with crusty bread (from freezer stash)</span>
          </div>
          <div>
            <span class="font-medium text-[var(--color-text)]">Sunday Dinner:</span>
            <span class="text-[var(--color-text-muted)]"> Batch prep time — eat leftovers or lighter meal</span>
          </div>
        </div>
      </div>

      <!-- Nutrition Summary -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Daily Nutrition Summary</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
          <div>
            <div class="text-[var(--color-text)]">Weekday</div>
            <div class="text-[var(--color-text-muted)]">~1,625 cal</div>
          </div>
          <div>
            <div class="text-[var(--color-text)]">Weekend</div>
            <div class="text-[var(--color-text-muted)]">~1,775–1,875 cal</div>
          </div>
          <div>
            <div class="text-[var(--color-text)]">Protein</div>
            <div class="text-[var(--color-text-muted)]">~115–125g</div>
          </div>
          <div>
            <div class="text-[var(--color-text)]">Omega-3s</div>
            <div class="text-[var(--color-text-muted)]">~2–2.5g</div>
          </div>
        </div>
      </div>
    </div>
  </Accordion>

  <!-- Grocery List - Organized by Meal/Prep -->
  <Accordion title="Weekly Grocery List" icon="🛒">
    <div class="space-y-6">
      <p class="text-[var(--color-text-muted)] text-sm italic">
        Organized by meal — skip entire sections if you're not making that dish this week.
      </p>

      <!-- BREAKFAST (Daily) -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">🍳 Breakfast <span class="text-xs font-normal text-[var(--color-text-muted)]">— daily, always buy</span></h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Item</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[15%]">Amount</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Storage</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[25%]">Lasts</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text-muted)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Whole wheat bread</td>
                <td class="py-2">1 loaf</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> or <span class="text-blue-400">❄️ Freezer</span></td>
                <td class="py-2">5–7 days / 3 mo frozen</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Crunchy peanut butter</td>
                <td class="py-2">per supply</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> or <span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">3 mo pantry / 6 mo fridge</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Grape jam</td>
                <td class="py-2">per supply</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span> after opening</td>
                <td class="py-2">6–12 months opened</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">2% milk</td>
                <td class="py-2">1 gallon</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">5–7 days after opening</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Whey protein powder</td>
                <td class="py-2">per supply</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span></td>
                <td class="py-2">1–2 years (check label)</td>
              </tr>
              <tr>
                <td class="py-2">Orange juice</td>
                <td class="py-2">1 small bottle</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">7–10 days after opening</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="border-b border-[var(--color-border)]/30"></div>

      <!-- SALMON DINNERS (Weeknights) -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">🐟 Salmon Dinners <span class="text-xs font-normal text-[var(--color-text-muted)]">— Mon–Sat, always buy</span></h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Item</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[15%]">Amount</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Storage</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[25%]">Lasts</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text-muted)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Salmon fillets</td>
                <td class="py-2">2.5 lbs</td>
                <td class="py-2"><span class="text-blue-400">❄️ Freezer</span> or <span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">3 mo frozen / 2 days thawed</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Green/brown lentils</td>
                <td class="py-2">2 cups dry</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> airtight</td>
                <td class="py-2">1–2 years dry</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Broccoli</td>
                <td class="py-2">2 large heads</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span> crisper</td>
                <td class="py-2">5–7 days</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Bell peppers</td>
                <td class="py-2">4 (mixed)</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span> crisper</td>
                <td class="py-2">1–2 weeks</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Zucchini</td>
                <td class="py-2">3 medium</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span> crisper</td>
                <td class="py-2">5–7 days</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Red onion</td>
                <td class="py-2">2</td>
                <td class="py-2"><span class="text-amber-400">🏠 Counter</span> cool, dark</td>
                <td class="py-2">2–3 weeks</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Lemons <span class="text-xs">(optional — for finishing)</span></td>
                <td class="py-2">2</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">3–4 weeks</td>
              </tr>
              <tr>
                <td class="py-2">Olive oil</td>
                <td class="py-2">per supply</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> cool, dark</td>
                <td class="py-2">1–2 years unopened</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="border-b border-[var(--color-border)]/30"></div>

      <!-- BEAN SOUP (Monthly) -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">🍲 Bean Soup <span class="text-xs font-normal text-[var(--color-text-muted)]">— monthly batch, skip most weeks</span></h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Item</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[15%]">Amount</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Storage</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[25%]">Lasts</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text-muted)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Canned white beans</td>
                <td class="py-2">2 cans (15 oz)</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span></td>
                <td class="py-2">2–5 years (check date)</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Canned diced tomatoes</td>
                <td class="py-2">1 can (14 oz)</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span></td>
                <td class="py-2">1–2 years (check date)</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Broth (veggie or chicken)</td>
                <td class="py-2">4 cups</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> / <span class="text-cyan-400">🧊 Fridge</span> once opened</td>
                <td class="py-2">1 year / 4–5 days opened</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Carrots</td>
                <td class="py-2">1 lb bag</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span> crisper</td>
                <td class="py-2">3–4 weeks</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Yellow onion</td>
                <td class="py-2">1</td>
                <td class="py-2"><span class="text-amber-400">🏠 Counter</span> cool, dark</td>
                <td class="py-2">2–3 months</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Garlic</td>
                <td class="py-2">1 head</td>
                <td class="py-2"><span class="text-amber-400">🏠 Counter</span> cool, dark</td>
                <td class="py-2">3–5 weeks whole</td>
              </tr>
              <tr>
                <td class="py-2">Spinach</td>
                <td class="py-2">1 bag</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">5–7 days</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="border-b border-[var(--color-border)]/30"></div>

      <!-- MEDITERRANEAN BOWL (Optional) -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2 flex items-center gap-2">
          🥗 Mediterranean Bowl
          <span class="text-xs font-normal px-2 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-text-muted)]">optional</span>
        </h4>
        <p class="text-xs text-[var(--color-text-muted)] mb-2 italic">Saturday lunch if you want a midday meal. Skip if doing 2 meals/day.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--color-border)]">
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Item</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[15%]">Amount</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[30%]">Storage</th>
                <th class="text-left py-2 text-[var(--color-text-muted)] w-[25%]">Lasts</th>
              </tr>
            </thead>
            <tbody class="text-[var(--color-text-muted)]">
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Quinoa</td>
                <td class="py-2">1 cup dry</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span> airtight</td>
                <td class="py-2">2–3 years dry</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Canned chickpeas</td>
                <td class="py-2">1 can (15 oz)</td>
                <td class="py-2"><span class="text-amber-400">🏠 Pantry</span></td>
                <td class="py-2">2–5 years (check date)</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Mixed greens</td>
                <td class="py-2">1 container</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">5–7 days (check date)</td>
              </tr>
              <tr class="border-b border-[var(--color-border)]/50">
                <td class="py-2">Cucumber</td>
                <td class="py-2">1</td>
                <td class="py-2"><span class="text-cyan-400">🧊 Fridge</span></td>
                <td class="py-2">1 week</td>
              </tr>
              <tr>
                <td class="py-2">Tomatoes</td>
                <td class="py-2">2</td>
                <td class="py-2"><span class="text-amber-400">🏠 Counter</span> until ripe, then fridge</td>
                <td class="py-2">1 week</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Legend -->
      <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
        <span class="font-medium text-[var(--color-text)]">Storage Key:</span>
        <span class="ml-2 text-amber-400">🏠 Pantry</span>
        <span class="ml-2 text-cyan-400">🧊 Fridge</span>
        <span class="ml-2 text-blue-400">❄️ Freezer</span>
      </div>
    </div>
  </Accordion>

  <!-- MAIN EVENT: Sunday Batch Prep Guide with ALL tips inline -->
  <Accordion title="Sunday Batch Prep Guide" icon="⏱️">
    <div class="space-y-6">
      <p class="text-[var(--color-text-muted)] text-sm italic">
        Total time: 90–120 minutes. Follow these steps in order — tips included at each step.
      </p>

      <!-- Step 1: Lentils -->
      <div class="border-l-4 border-[var(--color-accent)] pl-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">1</span>
          <div class="flex-1">
            <h4 class="font-semibold text-[var(--color-text)]">Start Lentils in Instant Pot</h4>
            <p class="text-sm text-[var(--color-text-muted)]">5 min active, 25 min hands-off</p>
          </div>
        </div>
        <div class="mt-3 ml-11 space-y-3">
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <p class="text-[var(--color-text)]"><strong>Do this:</strong></p>
            <ol class="text-[var(--color-text-muted)] space-y-1 list-decimal list-inside mt-1">
              <li>Add 2 cups dry green/brown lentils + 4 cups water</li>
              <li>Add a pinch of salt (3–4 shakes from shaker)</li>
              <li>Close lid, set to High Pressure 12 minutes</li>
              <li>Let natural release 10 minutes, then drain in strainer</li>
            </ol>
          </div>
          <p class="text-xs text-[var(--color-accent)]">💡 Use green or brown lentils — red lentils turn to mush!</p>
        </div>
      </div>

      <!-- Step 2: Prep Vegetables -->
      <div class="border-l-4 border-[var(--color-accent)] pl-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">2</span>
          <div class="flex-1">
            <h4 class="font-semibold text-[var(--color-text)]">Prep Vegetables for Roasting</h4>
            <p class="text-sm text-[var(--color-text-muted)]">15 min — do this while lentils cook</p>
          </div>
        </div>
        <div class="mt-3 ml-11 space-y-3">
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <p class="text-[var(--color-text)]"><strong>Vegetable mix — choose 3–4:</strong></p>
            <div class="grid grid-cols-2 gap-1 mt-1 text-[var(--color-text-muted)]">
              <span>🥦 Broccoli</span>
              <span>🫑 Bell peppers</span>
              <span>🥒 Zucchini</span>
              <span>🧅 Red onion</span>
              <span>🥕 Carrots</span>
              <span>🥬 Brussels sprouts</span>
            </div>
            <p class="mt-2 text-[var(--color-text)]"><strong>Recommended combo:</strong> Broccoli + bell peppers + zucchini + red onion</p>
          </div>

          <!-- Cutting tips inline -->
          <div class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-3 text-sm">
            <p class="text-[var(--color-accent)] font-medium mb-2">✂️ How to Cut Each Vegetable:</p>
            <div class="space-y-2 text-[var(--color-text-muted)]">
              <p><strong class="text-[var(--color-text)]">Bell peppers:</strong> Cut off top and bottom, slice down one side to open flat, remove seeds/ribs in one piece, then cut into 1-inch chunks.</p>
              <p><strong class="text-[var(--color-text)]">Zucchini:</strong> Cut off ends, slice lengthwise down the middle, cut each half into ½-inch half-moons.</p>
              <p><strong class="text-[var(--color-text)]">Broccoli:</strong> Cut where florets branch off from stem. If florets are huge, cut in half. <em>Save the stems for soup!</em></p>
              <p><strong class="text-[var(--color-text)]">Red onion:</strong> Cut off ends, slice in half through root, peel skin, lay flat and cut into wedges like pizza slices.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Roast Vegetables -->
      <div class="border-l-4 border-[var(--color-accent)] pl-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">3</span>
          <div class="flex-1">
            <h4 class="font-semibold text-[var(--color-text)]">Roast Vegetables</h4>
            <p class="text-sm text-[var(--color-text-muted)]">5 min active, 35 min in oven</p>
          </div>
        </div>
        <div class="mt-3 ml-11 space-y-3">
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <p class="text-[var(--color-text)]"><strong>Do this:</strong></p>
            <ol class="text-[var(--color-text-muted)] space-y-1 list-decimal list-inside mt-1">
              <li>Preheat oven to <strong>425°F</strong></li>
              <li>Toss veggies with olive oil (~1 tbsp per sheet pan) + salt + pepper — easiest with your hands</li>
              <li>Spread on 2 sheet pans in <strong>single layer with space between pieces</strong></li>
              <li>Roast 35 minutes total, <strong>stir/flip at 17 min</strong></li>
              <li>Done when edges are browned and tender (not mushy)</li>
            </ol>
          </div>
          <p class="text-xs text-[var(--color-accent)]">💡 Don't crowd the pan or they'll steam instead of roast!</p>
        </div>
      </div>

      <!-- Step 4: Portion Salmon -->
      <div class="border-l-4 border-[var(--color-accent)] pl-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">4</span>
          <div class="flex-1">
            <h4 class="font-semibold text-[var(--color-text)]">Portion Salmon</h4>
            <p class="text-sm text-[var(--color-text-muted)]">5 min</p>
          </div>
        </div>
        <div class="mt-3 ml-11 space-y-3">
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <p class="text-[var(--color-text)]"><strong>Do this:</strong></p>
            <ul class="text-[var(--color-text-muted)] space-y-1 list-disc list-inside mt-1">
              <li>Divide salmon into <strong>6 oz portions</strong></li>
              <li>Wrap each portion individually</li>
              <li>Refrigerate (use within 2 days) or freeze</li>
            </ul>
          </div>
          <p class="text-xs text-[var(--color-accent)]">💡 Cut vegetables BEFORE handling raw salmon, then wash board with hot soapy water after.</p>
        </div>
      </div>

      <!-- Step 5: Store Everything -->
      <div class="border-l-4 border-[var(--color-accent)] pl-4">
        <div class="flex items-start gap-3">
          <span class="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center font-bold">5</span>
          <div class="flex-1">
            <h4 class="font-semibold text-[var(--color-text)]">Portion & Store Everything</h4>
            <p class="text-sm text-[var(--color-text-muted)]">10 min</p>
          </div>
        </div>
        <div class="mt-3 ml-11 space-y-3">
          <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
            <p class="text-[var(--color-text)]"><strong>Storage times:</strong></p>
            <ul class="text-[var(--color-text-muted)] space-y-1 mt-1">
              <li><strong>Cooked lentils:</strong> 5 days in fridge</li>
              <li><strong>Roasted vegetables:</strong> 4–5 days in fridge</li>
              <li><strong>Raw salmon (thawed):</strong> Use within 2 days</li>
              <li><strong>Cooked salmon:</strong> 3 days in fridge</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- You're done! -->
      <div class="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-lg p-4 text-center">
        <p class="text-[var(--color-accent)] font-semibold">✅ Weekly batch prep complete!</p>
        <p class="text-sm text-[var(--color-text-muted)] mt-1">Bean soup is a separate monthly batch — see section below.</p>
      </div>
    </div>
  </Accordion>

  <!-- Weeknight Salmon (nightly cooking guide) -->
  <Accordion title="Weeknight Salmon Guide" icon="🐟">
    <div class="space-y-4">
      <p class="text-[var(--color-text-muted)] text-sm italic">
        Salmon is cooked fresh each night — total time ~10 minutes.
      </p>

      <!-- Thawing -->
      <div class="bg-[var(--color-surface)] rounded p-3 text-sm">
        <p class="text-[var(--color-accent)] font-medium mb-2">🧊 Thawing Options:</p>
        <ul class="text-[var(--color-text-muted)] space-y-1">
          <li><strong>Night before:</strong> Move one fillet from freezer to fridge</li>
          <li><strong>Same-day:</strong> Sealed bag in cold water for 20–30 min (weigh down with a plate)</li>
        </ul>
      </div>

      <!-- Cooking Steps -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Air Fryer Instructions</h4>
        <ol class="text-sm text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
          <li><strong>Preheat</strong> air fryer to 390°F (about 3 min)</li>
          <li><strong>Pat salmon completely dry</strong> with paper towels — crucial for texture!</li>
          <li><strong>Rub with ½ tsp olive oil</strong>, season generously with garlic salt and pepper</li>
          <li><strong>Place skin-side down</strong> in air fryer basket</li>
          <li><strong>Cook 7–8 minutes</strong> for 1-inch thick fillets. Do not flip.</li>
          <li><strong>Check internal temp:</strong> Pull at 125–130°F for medium</li>
          <li><strong>Rest 2 minutes</strong> before serving</li>
          <li><strong>Optional:</strong> Squeeze fresh lemon over the salmon — brightens the whole dish</li>
        </ol>
      </div>

      <!-- Temperature Guide -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">🌡️ Temperature Guide</h4>
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
          Most home cooks overcook salmon to 145°F+, which makes it dry and chalky. A thermometer is your friend!
        </p>
      </div>

      <!-- While cooking -->
      <div class="bg-[var(--color-bg)] border border-[var(--color-border)] rounded p-3 text-sm">
        <p class="text-[var(--color-accent)] font-medium mb-2">⏱️ While salmon cooks (7–8 min):</p>
        <ul class="text-[var(--color-text-muted)] space-y-1">
          <li>Microwave pre-portioned lentils (add a splash of water if dried out)</li>
          <li>Microwave pre-portioned vegetables, OR air fryer 3–4 min at 350°F for crispier texture</li>
        </ul>
      </div>
    </div>
  </Accordion>

  <!-- Bean Soup (Monthly) -->
  <Accordion title="Bean & Vegetable Soup (Monthly Batch)" icon="🍲">
    <div class="space-y-4">
      <p class="text-[var(--color-text-muted)] text-sm italic">
        Make once a month, freeze in 2-cup portions. ~4 Sunday lunches per batch.
      </p>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Ingredients -->
        <div>
          <h4 class="font-medium text-[var(--color-accent)] mb-2">Ingredients</h4>
          <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
            <li>1 yellow onion, diced</li>
            <li>3-4 cloves garlic, minced</li>
            <li>1 lb carrots, sliced into ¼" coins</li>
            <li>2 cans white beans (15 oz each), drained</li>
            <li>1 can diced tomatoes (14 oz) — juice and all</li>
            <li>4 cups vegetable or chicken broth</li>
            <li>1 bag spinach</li>
            <li>Olive oil, salt, pepper</li>
            <li>Broccoli stems from roasting prep (optional — don't waste them!)</li>
          </ul>
        </div>

        <!-- Instructions -->
        <div>
          <h4 class="font-medium text-[var(--color-accent)] mb-2">Instructions (Instant Pot)</h4>
          <ol class="text-sm text-[var(--color-text-muted)] space-y-2 list-decimal list-inside">
            <li><strong>Sauté mode:</strong> Heat olive oil, add onion and carrots</li>
            <li><strong>Cook until onions are translucent</strong> — go by visual cues, not the clock</li>
            <li><strong>Add garlic last</strong> — only 30 seconds, it burns easily!</li>
            <li><strong>Add everything else:</strong> beans, tomatoes (whole can), broth, spinach, broccoli stems</li>
            <li><strong>Pressure cook 15 minutes</strong>, natural release</li>
            <li><strong>Season to taste</strong> with salt and pepper</li>
          </ol>
        </div>
      </div>

      <!-- Cutting Tips -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">✂️ Cutting Tips for Soup</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-[var(--color-text-muted)]">
          <div>
            <strong class="text-[var(--color-text)]">Onion:</strong> Skip horizontal cuts (risky). Just halve, peel, cut vertical slices, then cut across into pieces.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Carrots:</strong> Slice into ¼" coins. If fat, halve lengthwise first, then slice into half-moons.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Garlic:</strong> A head contains multiple cloves. Smash cloves with a jar or can (safer than knife), peel, then mince.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Broccoli stems:</strong> Chop small and toss in — good fiber, don't waste them.
          </div>
        </div>
      </div>

      <!-- Storage -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">🧊 Storage & Reheating</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-[var(--color-text-muted)]">
          <div>
            <strong class="text-[var(--color-text)]">Fridge:</strong> 5–7 days
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Freezer:</strong> Cool first, leave 1" headspace, single portions, label with date. Good for 2–3 months.
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Reheat from fridge:</strong> Stovetop or microwave
          </div>
          <div>
            <strong class="text-[var(--color-text)]">Reheat from frozen:</strong> Thaw overnight in fridge, or microwave from frozen with extra time
          </div>
        </div>
      </div>
    </div>
  </Accordion>

  <!-- Quick Reference (condensed from old Kitchen Tips) -->
  <Accordion title="Quick Reference" icon="📋">
    <div class="space-y-4">
      <!-- Storage Times -->
      <div class="bg-[var(--color-surface)] rounded p-4">
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Storage Times at a Glance</h4>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div class="text-[var(--color-text-muted)]"><strong class="text-[var(--color-text)]">Cooked lentils:</strong> 5 days</div>
          <div class="text-[var(--color-text-muted)]"><strong class="text-[var(--color-text)]">Roasted veggies:</strong> 4–5 days</div>
          <div class="text-[var(--color-text-muted)]"><strong class="text-[var(--color-text)]">Raw salmon:</strong> 2 days</div>
          <div class="text-[var(--color-text-muted)]"><strong class="text-[var(--color-text)]">Cooked salmon:</strong> 3 days</div>
          <div class="text-[var(--color-text-muted)]"><strong class="text-[var(--color-text)]">Frozen soup:</strong> 2–3 months</div>
        </div>
      </div>

      <!-- Produce Storage -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Where to Store Produce</h4>
        <div class="grid md:grid-cols-2 gap-4 text-sm text-[var(--color-text-muted)]">
          <div><strong class="text-[var(--color-text)]">Fridge:</strong> Salad greens, cucumber, carrots, lemons, tomatoes</div>
          <div><strong class="text-[var(--color-text)]">Counter:</strong> Yellow onion, garlic (cool dry spot)</div>
        </div>
      </div>

      <!-- Reheating -->
      <div>
        <h4 class="font-medium text-[var(--color-accent)] mb-2">Reheating</h4>
        <ul class="text-sm text-[var(--color-text-muted)] space-y-1">
          <li><strong>Vegetables:</strong> Air fryer 3–4 min at 350°F (crispiest), or microwave (softer)</li>
          <li><strong>Lentils:</strong> Microwave — add a splash of water if dried out</li>
          <li><strong>Soup:</strong> Stovetop or microwave; from frozen, microwave in 2-min bursts stirring between</li>
        </ul>
      </div>

      <!-- Lemon tip -->
      <div class="text-sm text-[var(--color-text-muted)]">
        <strong class="text-[var(--color-text)]">Lemon juice:</strong> Cut in half, jab a fork into the cut side and twist while squeezing. Store cut-side down in fridge (lasts about a week).
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
