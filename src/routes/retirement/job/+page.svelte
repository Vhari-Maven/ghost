<script lang="ts">
import { enhance } from '$app/forms';
import { centsToDollarsInput as dollars } from '$lib/argent/format';
import type { PageProps } from './$types';

let { data, form }: PageProps = $props();
const pct = (fraction: number) => Math.round(fraction * 10000) / 100;

const parsed = $derived(form && 'parsed' in form ? form.parsed : null);

// Prefill from a just-imported LES when present, else the saved row.
const initial = $derived({
	salary: dollars(parsed?.salaryCents ?? data.job.salaryCents),
	serviceStartDate: parsed?.serviceStartDate ?? data.job.serviceStartDate,
	tspTraditional: pct(parsed?.tspTraditionalPct ?? data.job.tspTraditionalPct),
	tspRoth: pct(parsed?.tspRothPct ?? data.job.tspRothPct),
	fersContribution: pct(
		parsed?.fersContributionPct ?? data.job.fersContributionPct,
	),
	employerHealth: dollars(
		parsed?.employerHealthCents ?? data.job.employerHealthCents,
	),
	employeeHealth: dollars(
		parsed?.employeeHealthCents ?? data.job.employeeHealthCents,
	),
});
</script>

<h1>Job</h1>

<p class="hint">
	Federal job details. Total compensation = salary + employer health
	contribution + employer TSP (1% automatic + match on your contribution).
</p>

<form
	method="POST"
	action="?/importLes"
	enctype="multipart/form-data"
	use:enhance
	class="import-row"
>
	<label class="file-label">
		Import from LES (DFAS PDF)
		<input name="les" type="file" accept="application/pdf" required />
	</label>
	<button type="submit">Parse LES</button>
</form>

{#if parsed}
	<div class="banner">
		<strong>Imported{parsed.gradeStep ? ` — ${parsed.gradeStep}` : ''}</strong>
		{#if parsed.payPeriodEnd}(pay period ending {parsed.payPeriodEnd}){/if}
		— review the prefilled fields below, then Save.
		{#each parsed.warnings as w (w)}
			<span class="warning">⚠ {w}</span>
		{/each}
	</div>
{/if}

{#key parsed}
	<form method="POST" action="?/save" use:enhance class="grid">
		<label>
			Base salary (annual $)
			<input name="salary" value={initial.salary} required />
		</label>
		<label>
			Service start date
			<input name="serviceStartDate" type="date" value={initial.serviceStartDate} required />
		</label>
		<label>
			TSP — traditional (% of salary)
			<input name="tspTraditional" value={initial.tspTraditional} required />
		</label>
		<label>
			TSP — Roth (% of salary)
			<input name="tspRoth" value={initial.tspRoth} required />
		</label>
		<label>
			FERS contribution (% of salary)
			<input name="fersContribution" value={initial.fersContribution} required />
		</label>
		<label>
			Employer health contribution (annual $)
			<input name="employerHealth" value={initial.employerHealth} required />
		</label>
		<label>
			Your health premium (annual $, pre-tax)
			<input name="employeeHealth" value={initial.employeeHealth} required />
		</label>
		<div class="actions">
			<button type="submit">Save</button>
			{#if form?.error}<span class="error">{form.error}</span>{/if}
		</div>
	</form>
{/key}

<h2>Social Security earnings record</h2>

<p class="hint">
	From your SSA statement's earnings table — used to compute your actual
	benefit (the statement's own estimate assumes you never stop working).
	Re-adding a year overwrites it.
</p>

{#if data.earnings.length > 0}
	<table>
		<thead>
			<tr><th>Year</th><th class="num">Covered earnings</th><th></th></tr>
		</thead>
		<tbody>
			{#each data.earnings as row (row.year)}
				<tr>
					<td>{row.year}</td>
					<td class="num">
						{(row.earningsCents / 100).toLocaleString('en-US', {
							style: 'currency',
							currency: 'USD',
							maximumFractionDigits: 0,
						})}
					</td>
					<td>
						<form method="POST" action="?/deleteEarnings" use:enhance>
							<input type="hidden" name="year" value={row.year} />
							<button type="submit" class="link">delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No earnings history entered yet.</p>
{/if}

<form method="POST" action="?/addEarnings" use:enhance class="inline">
	<label>
		Year
		<input name="year" type="number" min="1950" max="2100" required />
	</label>
	<label>
		Earnings ($)
		<input name="earnings" required />
	</label>
	<button type="submit">Add / update year</button>
</form>

<style>
	.hint {
		color: var(--ink-secondary);
		max-width: 40rem;
	}

	.import-row {
		display: flex;
		align-items: end;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.file-label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}

	.banner {
		max-width: 41rem;
		box-sizing: border-box;
		padding: 0.75rem 1rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-left: 3px solid var(--viz-1);
		border-radius: 0.4rem;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.banner .warning {
		color: var(--error);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 20rem));
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}

	input,
	button {
		padding: 0.4rem 0.6rem;
		font-size: 1rem;
	}

	.actions {
		grid-column: 1 / -1;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.inline {
		display: flex;
		align-items: end;
		gap: 1rem;
		margin-top: 1rem;
	}

	table {
		border-collapse: collapse;
		background: var(--card);
		border: 1px solid var(--border);
	}

	th,
	td {
		text-align: left;
		padding: 0.35rem 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.num {
		text-align: right;
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
