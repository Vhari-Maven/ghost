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
</script>

<h1>Expenses</h1>

<p class="hint">
	Annual amounts in today's dollars, grown with inflation. "While working"
	rows (commuting, work lunches…) stop at separation; "in retirement" rows
	(travel…) start there. Don't add rows for payroll taxes, TSP, income
	taxes, or <strong>health coverage</strong> — the engine computes those
	(health premiums and Medicare from the Job screen and built-in constants,
	switching automatically between FEHB, private-coverage gap, and Medicare
	as retirement age changes).
</p>

{#if data.expenses.length > 0}
	<section class="totals">
		<div>
			<span class="label">While working</span>
			<span>{formatCents(totalFor(['always', 'working']))}/yr</span>
		</div>
		<div>
			<span class="label">In retirement</span>
			<span>{formatCents(totalFor(['always', 'retirement']))}/yr</span>
		</div>
	</section>

	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th class="num">Annual ($)</th>
				<th>Applies</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.expenses as e (e.id)}
				<tr>
					<td>{e.name}</td>
					<td class="num">
						<input
							class="cell-input"
							name="annual"
							form="exp-{e.id}"
							value={dollars(e.annualCents)}
							required
						/>
					</td>
					<td>
						<select name="applies" form="exp-{e.id}" value={e.applies}>
							{#each Object.entries(APPLIES_LABELS) as [value, label] (value)}
								<option {value}>{label}</option>
							{/each}
						</select>
					</td>
					<td class="row-actions">
						<form id="exp-{e.id}" method="POST" action="?/update" use:enhance>
							<input type="hidden" name="id" value={e.id} />
							<button type="submit" class="link save">save</button>
						</form>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={e.id} />
							<button type="submit" class="link">delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No expenses yet.</p>
{/if}

<h2>Add expense</h2>

<form method="POST" action="?/create" use:enhance class="inline">
	<label>
		Name
		<input name="name" required />
	</label>
	<label>
		Annual ($)
		<input name="annual" required />
	</label>
	<label>
		Applies
		<select name="applies">
			{#each Object.entries(APPLIES_LABELS) as [value, label] (value)}
				<option {value}>{label}</option>
			{/each}
		</select>
	</label>
	<button type="submit">Add</button>
	{#if form?.error}<span class="error">{form.error}</span>{/if}
</form>

<style>
	.hint {
		color: var(--ink-secondary);
		max-width: 42rem;
	}

	.totals {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.totals div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 1rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-weight: 600;
	}

	.totals .label {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--ink-secondary);
	}

	table {
		border-collapse: collapse;
		width: 100%;
		background: var(--card);
		border: 1px solid var(--border);
	}

	th,
	td {
		text-align: left;
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.num {
		text-align: right;
	}

	.cell-input {
		width: 8rem;
		text-align: right;
		padding: 0.25rem 0.45rem;
		font-size: 0.95rem;
	}

	.row-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.link.save {
		color: var(--success);
	}

	.inline {
		display: flex;
		align-items: end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}

	input,
	select,
	button {
		padding: 0.4rem 0.6rem;
		font-size: 1rem;
	}

	.link {
		background: none;
		border: none;
		color: var(--error);
		cursor: pointer;
		padding: 0;
		font-size: 0.85rem;
	}

	.error {
		color: var(--error);
	}
</style>
