<script lang="ts">
import { enhance } from '$app/forms';
import { centsToDollarsInput as dollars, formatCents } from '$lib/argent/format';
import type { PageProps } from './$types';

let { data, form }: PageProps = $props();

const APPLIES_LABELS: Record<string, string> = {
	always: 'Always',
	working: 'While working',
	retirement: 'In retirement',
};

const totalFor = (applies: string[]) =>
	data.expenses
		.filter((e) => applies.includes(e.applies))
		.reduce((s, e) => s + e.annualCents, 0);

// Shared Tailwind fragments (ghost design language — see DESIGN.md)
const input =
	'bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';
const btn =
	'px-3 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors';
const label = 'flex flex-col gap-1 text-sm text-[var(--color-text-muted)]';
const th = 'text-left py-2 px-3 text-[var(--color-text-muted)] font-medium';
const td = 'py-2 px-3';
const bodyRow = 'border-b border-[var(--color-border)] last:border-b-0';
</script>

<h2 class="text-xl font-semibold mb-2">Expenses</h2>

<p class="text-sm text-[var(--color-text-muted)] max-w-2xl mb-4">
	Annual amounts in today's dollars, grown with inflation. "While working"
	rows (commuting, work lunches…) stop at separation; "in retirement" rows
	(travel…) start there. Don't add rows for payroll taxes, TSP, income
	taxes, or <strong class="text-[var(--color-text)]">health coverage</strong> — the engine computes those
	(health premiums and Medicare from the Job screen and built-in constants,
	switching automatically between FEHB, private-coverage gap, and Medicare
	as retirement age changes).
</p>

{#if data.expenses.length > 0}
	<section class="flex gap-4 mb-6 flex-wrap">
		<div class="flex flex-col gap-0.5 py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold">
			<span class="text-xs font-normal text-[var(--color-text-muted)]">While working</span>
			<span>{formatCents(totalFor(['always', 'working']))}/yr</span>
		</div>
		<div class="flex flex-col gap-0.5 py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold">
			<span class="text-xs font-normal text-[var(--color-text-muted)]">In retirement</span>
			<span>{formatCents(totalFor(['always', 'retirement']))}/yr</span>
		</div>
	</section>

	<div class="overflow-x-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mb-6">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)]">
					<th class={th}>Name</th>
					<th class="{th} text-right">Annual ($)</th>
					<th class={th}>Applies</th>
					<th class={th}></th>
				</tr>
			</thead>
			<tbody>
				{#each data.expenses as e (e.id)}
					<tr class={bodyRow}>
						<td class={td}>{e.name}</td>
						<td class="{td} text-right">
							<input
								class="{input} w-32 text-right py-1 px-2 bg-[var(--color-bg)]"
								name="annual"
								form="exp-{e.id}"
								value={dollars(e.annualCents)}
								required
							/>
						</td>
						<td class={td}>
							<select
								class="{input} py-1 px-2 bg-[var(--color-bg)]"
								name="applies"
								form="exp-{e.id}"
								value={e.applies}
							>
								{#each Object.entries(APPLIES_LABELS) as [value, label] (value)}
									<option {value}>{label}</option>
								{/each}
							</select>
						</td>
						<td class={td}>
							<div class="flex gap-3 items-center">
								<form id="exp-{e.id}" method="POST" action="?/update" use:enhance>
									<input type="hidden" name="id" value={e.id} />
									<button type="submit" class="text-xs text-[var(--color-success)] hover:underline">save</button>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={e.id} />
									<button type="submit" class="text-xs text-[var(--color-error)] hover:underline">delete</button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p class="text-[var(--color-text-muted)] mb-6">No expenses yet.</p>
{/if}

<h3 class="text-lg font-semibold mb-3">Add expense</h3>

<form method="POST" action="?/create" use:enhance class="flex items-end gap-4 flex-wrap">
	<label class={label}>
		Name
		<input class={input} name="name" required />
	</label>
	<label class={label}>
		Annual ($)
		<input class={input} name="annual" required />
	</label>
	<label class={label}>
		Applies
		<select class={input} name="applies">
			{#each Object.entries(APPLIES_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</label>
	<button type="submit" class={btn}>Add</button>
	{#if form?.error}<span class="text-sm text-[var(--color-error)]">{form.error}</span>{/if}
</form>
