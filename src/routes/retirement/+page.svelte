<script lang="ts">
import { enhance } from '$app/forms';
import TimeSeriesChart from '$lib/argent/TimeSeriesChart.svelte';
import { project } from '$lib/argent/engine/project';
import { formatCents } from '$lib/argent/format';
import type { PageProps } from './$types';

let { data, form }: PageProps = $props();

// Live knobs, seeded from saved assumptions. Adjusting them recomputes the
// projection instantly; "Save as defaults" persists them.
let retirementAge = $state(data.inputs.knobs.retirementAge);
let ssClaimingAge = $state(data.inputs.knobs.ssClaimingAge);
let returnPctInput = $state(data.inputs.knobs.nominalReturnPct * 100);
let inflationPctInput = $state(data.inputs.knobs.inflationPct * 100);
let showReal = $state(true);

// "More assumptions" — rarely touched, same save.
let birthDate = $state(data.inputs.birthDate);
let stateTaxPctInput = $state(data.inputs.knobs.stateTaxPct * 100);
let endAge = $state(data.inputs.knobs.endAge);
let wageTracksInflation = $state(data.inputs.knobs.wageGrowthPct == null);
let wageGrowthPctInput = $state(
	(data.inputs.knobs.wageGrowthPct ?? data.inputs.knobs.inflationPct) * 100,
);

const wageGrowthPct = $derived(
	wageTracksInflation ? null : wageGrowthPctInput / 100,
);

const projection = $derived(
	project({
		...data.inputs,
		birthDate,
		knobs: {
			...data.inputs.knobs,
			retirementAge,
			ssClaimingAge,
			nominalReturnPct: returnPctInput / 100,
			inflationPct: inflationPctInput / 100,
			stateTaxPct: stateTaxPctInput / 100,
			endAge,
			wageGrowthPct,
		},
	}),
);

const rows = $derived(projection.rows);
const years = $derived(rows.map((r) => r.year));
const ages = $derived(rows.map((r) => r.age));

const deflator = $derived((i: number) => (1 + inflationPctInput / 100) ** i);
const display = $derived((cents: number, i: number) =>
	showReal ? Math.round(cents / deflator(i)) : cents,
);

const wealthStacks = $derived([
	{
		name: 'Cash',
		color: 'var(--color-viz-4)',
		values: rows.map((r, i) => display(r.cashCents, i)),
	},
	{
		name: 'Taxable',
		color: 'var(--color-viz-1)',
		values: rows.map((r, i) => display(r.taxableCents, i)),
	},
	{
		name: 'Tax-deferred',
		color: 'var(--color-viz-2)',
		values: rows.map((r, i) => display(r.deferredCents, i)),
	},
	{
		name: 'Roth',
		color: 'var(--color-viz-3)',
		values: rows.map((r, i) => display(r.rothCents, i)),
	},
]);

const incomeStacks = $derived([
	{
		name: 'Salary',
		color: 'var(--color-viz-1)',
		values: rows.map((r, i) => display(r.salaryCents, i)),
	},
	{
		name: 'FERS annuity',
		color: 'var(--color-viz-2)',
		values: rows.map((r, i) => display(r.fersAnnuityCents + r.srsCents, i)),
	},
	{
		name: 'Social Security',
		color: 'var(--color-viz-3)',
		values: rows.map((r, i) => display(r.ssBenefitCents, i)),
	},
	{
		name: 'Investment returns',
		color: 'var(--color-viz-4)',
		values: rows.map((r, i) => display(r.investmentGrowthCents, i)),
	},
	{
		name: 'Employer benefits (in-kind)',
		color: 'var(--color-viz-5)',
		values: rows.map((r, i) =>
			display(r.healthInKindCents + r.employerTspCents, i),
		),
	},
]);

// Economic frame: the stack counts income when it accrues (investment
// growth included, withdrawals excluded — they'd double-count), and the
// spending line carries the full health-coverage cost (in expensesCents)
// plus taxes and the FERS contribution, so stack − line = Δ net worth.
const spendingOverlay = $derived({
	name: 'Expenses + taxes',
	values: rows.map((r, i) =>
		display(
			r.expensesCents +
				r.federalTaxCents +
				r.capitalGainsTaxCents +
				r.stateTaxCents +
				r.ficaCents +
				r.earlyWithdrawalPenaltyCents +
				r.fersContributionCents,
			i,
		),
	),
});

// Expense categories ranked by projected lifetime total; the top four get
// their own band, the tail folds into "Everything else". Colors follow the
// ranked identity so a category keeps its hue as knobs move.
const expenseCategoryOrder = $derived.by(() => {
	const totals = new Map<string, number>();
	for (const r of rows) {
		for (const [name, cents] of Object.entries(r.expensesByCategory)) {
			totals.set(name, (totals.get(name) ?? 0) + cents);
		}
	}
	return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
});

const expenseStacks = $derived.by(() => {
	const vizColors = [
		'var(--color-viz-1)',
		'var(--color-viz-2)',
		'var(--color-viz-3)',
		'var(--color-viz-4)',
	];
	const top = expenseCategoryOrder.slice(0, 4);
	const rest = expenseCategoryOrder.slice(4);
	const stacks = top.map((name, k) => ({
		name,
		color: vizColors[k],
		values: rows.map((r, i) => display(r.expensesByCategory[name] ?? 0, i)),
	}));
	if (rest.length > 0) {
		stacks.push({
			name: 'Everything else',
			color: 'var(--color-viz-5)',
			values: rows.map((r, i) =>
				display(
					rest.reduce((s, n) => s + (r.expensesByCategory[n] ?? 0), 0),
					i,
				),
			),
		});
	}
	return stacks;
});

const taxStacks = $derived([
	{
		name: 'Federal income',
		color: 'var(--color-viz-1)',
		values: rows.map((r, i) => display(r.federalTaxCents, i)),
	},
	{
		name: 'FICA',
		color: 'var(--color-viz-2)',
		values: rows.map((r, i) => display(r.ficaCents, i)),
	},
	{
		name: 'State',
		color: 'var(--color-viz-3)',
		values: rows.map((r, i) => display(r.stateTaxCents, i)),
	},
	{
		name: 'Capital gains',
		color: 'var(--color-viz-4)',
		values: rows.map((r, i) => display(r.capitalGainsTaxCents, i)),
	},
	{
		name: 'Early-withdrawal penalty',
		color: 'var(--color-viz-5)',
		values: rows.map((r, i) => display(r.earlyWithdrawalPenaltyCents, i)),
	},
]);

const birthYear = $derived(Number(data.inputs.birthDate.slice(0, 4)));

const separationRow = $derived(
	rows.find((r) => r.age === retirementAge) ?? rows.at(-1),
);
const netWorthAtRetirement = $derived(
	separationRow
		? display(separationRow.netWorthCents, separationRow.year - years[0])
		: 0,
);

const fersAnnuityDisplay = $derived.by(() => {
	const f = projection.fers;
	if (!f.eligible) return null;
	const commencementYear = birthYear + f.commencementAge;
	const i = commencementYear - years[0];
	return {
		annual: showReal
			? Math.round(
					f.annualAnnuityAtCommencementCents / deflator(Math.max(0, i)),
				)
			: f.annualAnnuityAtCommencementCents,
		age: f.commencementAge,
		deferred: !f.immediate,
	};
});

const unit = $derived(showReal ? "today's dollars" : 'nominal dollars');

// Shared Tailwind fragments (ghost design language — see DESIGN.md)
const input =
	'bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';
const btn =
	'px-3.5 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors';
const knob = 'flex flex-col gap-1.5 text-sm text-[var(--color-text-muted)]';
const th =
	'text-left py-1.5 px-2.5 text-[var(--color-text-muted)] font-medium whitespace-nowrap';
const td = 'py-1.5 px-2.5 whitespace-nowrap';
const num = 'text-right tabular-nums';
</script>

<h2 class="text-xl font-semibold mb-3">Projection</h2>

<form
	method="POST"
	action="?/save"
	use:enhance
	class="py-3.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mb-4"
>
	<div class="flex items-end gap-5 flex-wrap">
		<label class="{knob} min-w-64">
			<span>Retirement age <strong class="text-[var(--color-text)]">{retirementAge}</strong></span>
			<input type="range" min="40" max="70" bind:value={retirementAge} class="accent-[var(--color-accent)]" />
			<input type="hidden" name="retirementAge" value={retirementAge} />
		</label>
		<label class={knob}>
			<span>SS claim age</span>
			<input class="{input} w-20" type="number" min="62" max="70" bind:value={ssClaimingAge} />
			<input type="hidden" name="ssClaimingAge" value={ssClaimingAge} />
		</label>
		<label class={knob}>
			<span>Return %/yr</span>
			<input class="{input} w-20" type="number" step="0.5" min="0" max="15" bind:value={returnPctInput} />
			<input type="hidden" name="nominalReturnPct" value={returnPctInput / 100} />
		</label>
		<label class={knob}>
			<span>Inflation %/yr</span>
			<input class="{input} w-20" type="number" step="0.25" min="0" max="10" bind:value={inflationPctInput} />
			<input type="hidden" name="inflationPct" value={inflationPctInput / 100} />
		</label>
		<label class={knob}>
			<span>Display</span>
			<span class="flex items-center gap-1.5 py-1.5">
				<input type="checkbox" bind:checked={showReal} class="accent-[var(--color-accent)]" />
				today's $
			</span>
		</label>
		<button type="submit" class={btn}>Save as defaults</button>
		{#if form?.error}<span class="text-sm text-[var(--color-error)]">{form.error}</span>{/if}
	</div>

	<details class="mt-2.5">
		<summary class="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] py-1 select-none">
			More assumptions
		</summary>
		<div class="flex items-end gap-5 flex-wrap pt-2.5">
			<label class={knob}>
				<span>Birth date</span>
				<input class={input} type="date" name="birthDate" bind:value={birthDate} />
			</label>
			<label class={knob}>
				<span>State tax %</span>
				<input class="{input} w-20" type="number" step="0.25" min="0" max="15" bind:value={stateTaxPctInput} />
				<input type="hidden" name="stateTaxPct" value={stateTaxPctInput / 100} />
			</label>
			<label class={knob}>
				<span>End-of-plan age</span>
				<input class="{input} w-20" type="number" name="endAge" min="70" max="110" bind:value={endAge} />
			</label>
			<label class={knob}>
				<span>Wage growth</span>
				<span class="flex items-center gap-1.5 py-1.5">
					<input type="checkbox" bind:checked={wageTracksInflation} class="accent-[var(--color-accent)]" />
					track inflation
				</span>
			</label>
			{#if !wageTracksInflation}
				<label class={knob}>
					<span>Wage growth %/yr</span>
					<input class="{input} w-20" type="number" step="0.25" min="0" max="10" bind:value={wageGrowthPctInput} />
				</label>
			{/if}
			<input
				type="hidden"
				name="wageGrowthPct"
				value={wageGrowthPct == null ? '' : wageGrowthPct}
			/>
		</div>
	</details>
</form>

<section class="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-4 mb-4">
	<div class="flex flex-col gap-1 py-3.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
		<span class="text-xs text-[var(--color-text-muted)]">Plan status</span>
		{#if projection.firstShortfallAge === null}
			<span class="text-xl font-semibold text-[var(--color-success)]">Funded to {endAge}</span>
		{:else}
			<span class="text-xl font-semibold text-[var(--color-error)]">⚠ Shortfall at {projection.firstShortfallAge}</span>
		{/if}
	</div>
	<div class="flex flex-col gap-1 py-3.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
		<span class="text-xs text-[var(--color-text-muted)]">Net worth at {retirementAge}</span>
		<span class="text-xl font-semibold">{formatCents(netWorthAtRetirement)}</span>
	</div>
	<div class="flex flex-col gap-1 py-3.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
		<span class="text-xs text-[var(--color-text-muted)]">
			FERS annuity from {fersAnnuityDisplay?.age ?? '—'}
			{#if fersAnnuityDisplay?.deferred}(deferred){/if}
		</span>
		<span class="text-xl font-semibold">
			{fersAnnuityDisplay ? `${formatCents(fersAnnuityDisplay.annual)}/yr` : 'not eligible'}
		</span>
	</div>
	<div class="flex flex-col gap-1 py-3.5 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
		<span class="text-xs text-[var(--color-text-muted)]">Social Security at {ssClaimingAge}</span>
		<span class="text-xl font-semibold">{formatCents(projection.ssMonthlyAtClaimTodayCents)}/mo</span>
	</div>
</section>

<div class="flex flex-col gap-4 mb-4">
	<TimeSeriesChart
		title="Wealth by bucket"
		valueLabel={unit}
		{years}
		{ages}
		stacks={wealthStacks}
	/>
	<TimeSeriesChart
		title="Income by source vs spending"
		valueLabel={unit}
		{years}
		{ages}
		stacks={incomeStacks}
		overlay={spendingOverlay}
	/>
	<TimeSeriesChart
		title="Expenses by category"
		valueLabel="{unit} — top categories get their own band; the rest fold into “Everything else”"
		{years}
		{ages}
		stacks={expenseStacks}
	/>
	<TimeSeriesChart
		title="Taxes by source"
		{years}
		{ages}
		valueLabel={unit}
		stacks={taxStacks}
	/>
</div>

<details class="mb-4">
	<summary class="text-[var(--color-text-muted)] hover:text-[var(--color-text)] py-2 select-none">
		Year-by-year table
	</summary>
	<div class="overflow-x-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)]">
					<th class={th}>Year</th>
					<th class={th}>Age</th>
					<th class="{th} {num}">Salary</th>
					<th class="{th} {num}">FERS</th>
					<th class="{th} {num}">Soc. Sec.</th>
					<th class="{th} {num}">Returns</th>
					<th class="{th} {num}">Withdrawals</th>
					<th class="{th} {num}">Taxes</th>
					<th class="{th} {num}">Expenses</th>
					<th class="{th} {num}">Net cash flow</th>
					<th class="{th} {num}">Net worth</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r, i (r.year)}
					<tr
						class="border-b border-[var(--color-border)] last:border-b-0
							{r.shortfallCents > 0 ? 'text-[var(--color-error)]' : ''}
							{r.age === retirementAge ? 'border-t-2 border-t-[var(--color-border-hover)]' : ''}"
					>
						<td class={td}>{r.year}</td>
						<td class={td}>{r.age}</td>
						<td class="{td} {num}">{r.salaryCents ? formatCents(display(r.salaryCents, i)) : '—'}</td>
						<td class="{td} {num}">
							{r.fersAnnuityCents + r.srsCents
								? formatCents(display(r.fersAnnuityCents + r.srsCents, i))
								: '—'}
						</td>
						<td class="{td} {num}">
							{r.ssBenefitCents ? formatCents(display(r.ssBenefitCents, i)) : '—'}
						</td>
						<td class="{td} {num}">
							{r.investmentGrowthCents
								? formatCents(display(r.investmentGrowthCents, i))
								: '—'}
						</td>
						<td class="{td} {num}">
							{formatCents(
								display(
									r.withdrawalCashCents +
										r.withdrawalTaxableCents +
										r.withdrawalRothBasisCents +
										r.withdrawalDeferredCents +
										r.withdrawalRothEarningsCents,
									i,
								),
							)}
						</td>
						<td class="{td} {num}">
							{formatCents(
								display(
									r.federalTaxCents +
										r.capitalGainsTaxCents +
										r.stateTaxCents +
										r.ficaCents +
										r.earlyWithdrawalPenaltyCents,
									i,
								),
							)}
						</td>
						<td class="{td} {num}">{formatCents(display(r.expensesCents, i))}</td>
						<td class="{td} {num}">{formatCents(display(r.netCashFlowCents, i))}</td>
						<td class="{td} {num}">{formatCents(display(r.netWorthCents, i))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</details>

<p class="text-xs text-[var(--color-text-muted)] max-w-3xl">
	All amounts in {unit}. Constants (tax brackets, bend points, limits) are 2026
	figures — see <code>src/lib/argent/engine/constants.ts</code>.
	{#if projection.fers.eligible && !projection.fers.immediate}
		Retiring at {retirementAge} is before FERS immediate eligibility: the annuity
		defers to 62 with the high-3 frozen at separation, and there is no retiree
		health coverage or SRS — make sure an expense row covers private health
		insurance.
	{/if}
</p>
