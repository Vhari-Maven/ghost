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

<h2 class="text-xl font-semibold mb-2">Job</h2>

<p class="text-sm text-[var(--color-text-muted)] max-w-2xl mb-4">
	Federal job details. Total compensation = salary + employer health
	contribution + employer TSP (1% automatic + match on your contribution).
</p>

<form
	method="POST"
	action="?/importLes"
	enctype="multipart/form-data"
	use:enhance
	class="flex items-end gap-4 mb-4 flex-wrap"
>
	<label class={label}>
		Import from LES (DFAS PDF)
		<input class={input} name="les" type="file" accept="application/pdf" required />
	</label>
	<button type="submit" class={btn}>Parse LES</button>
</form>

{#if parsed}
	<div class="max-w-2xl py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] border-l-2 border-l-[var(--color-accent)] rounded-lg mb-4 text-sm flex flex-col gap-1">
		<strong>Imported{parsed.gradeStep ? ` — ${parsed.gradeStep}` : ''}</strong>
		{#if parsed.payPeriodEnd}(pay period ending {parsed.payPeriodEnd}){/if}
		— review the prefilled fields below, then Save.
		{#each parsed.warnings as w (w)}
			<span class="text-[var(--color-error)]">⚠ {w}</span>
		{/each}
	</div>
{/if}

{#key parsed}
	<form method="POST" action="?/save" use:enhance class="grid grid-cols-[repeat(2,minmax(0,20rem))] gap-4">
		<label class={label}>
			Base salary (annual $)
			<input class={input} name="salary" value={initial.salary} required />
		</label>
		<label class={label}>
			Service start date
			<input class={input} name="serviceStartDate" type="date" value={initial.serviceStartDate} required />
		</label>
		<label class={label}>
			TSP — traditional (% of salary)
			<input class={input} name="tspTraditional" value={initial.tspTraditional} required />
		</label>
		<label class={label}>
			TSP — Roth (% of salary)
			<input class={input} name="tspRoth" value={initial.tspRoth} required />
		</label>
		<label class={label}>
			FERS contribution (% of salary)
			<input class={input} name="fersContribution" value={initial.fersContribution} required />
		</label>
		<label class={label}>
			Employer health contribution (annual $)
			<input class={input} name="employerHealth" value={initial.employerHealth} required />
		</label>
		<label class={label}>
			Your health premium (annual $, pre-tax)
			<input class={input} name="employeeHealth" value={initial.employeeHealth} required />
		</label>
		<div class="col-span-full flex items-center gap-4">
			<button type="submit" class={btn}>Save</button>
			{#if form?.error}<span class="text-sm text-[var(--color-error)]">{form.error}</span>{/if}
		</div>
	</form>
{/key}

<h3 class="text-lg font-semibold mt-8 mb-2">Social Security earnings record</h3>

<p class="text-sm text-[var(--color-text-muted)] max-w-2xl mb-4">
	From your SSA statement's earnings table — used to compute your actual
	benefit (the statement's own estimate assumes you never stop working).
	Re-adding a year overwrites it.
</p>

{#if data.earnings.length > 0}
	<div class="inline-block overflow-x-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mb-4">
		<table class="border-collapse text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)]">
					<th class={th}>Year</th>
					<th class="{th} text-right">Covered earnings</th>
					<th class={th}></th>
				</tr>
			</thead>
			<tbody>
				{#each data.earnings as row (row.year)}
					<tr class={bodyRow}>
						<td class={td}>{row.year}</td>
						<td class="{td} text-right tabular-nums">
							{(row.earningsCents / 100).toLocaleString('en-US', {
								style: 'currency',
								currency: 'USD',
								maximumFractionDigits: 0,
							})}
						</td>
						<td class={td}>
							<form method="POST" action="?/deleteEarnings" use:enhance>
								<input type="hidden" name="year" value={row.year} />
								<button type="submit" class="text-xs text-[var(--color-error)] hover:underline">delete</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<p class="text-[var(--color-text-muted)] mb-4">No earnings history entered yet.</p>
{/if}

<form method="POST" action="?/addEarnings" use:enhance class="flex items-end gap-4 mt-2 flex-wrap">
	<label class={label}>
		Year
		<input class="{input} w-24" name="year" type="number" min="1950" max="2100" required />
	</label>
	<label class={label}>
		Earnings ($)
		<input class={input} name="earnings" required />
	</label>
	<button type="submit" class={btn}>Add / update year</button>
</form>
