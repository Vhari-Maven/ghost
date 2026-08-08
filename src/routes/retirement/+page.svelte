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
		color: 'var(--viz-4)',
		values: rows.map((r, i) => display(r.cashCents, i)),
	},
	{
		name: 'Taxable',
		color: 'var(--viz-1)',
		values: rows.map((r, i) => display(r.taxableCents, i)),
	},
	{
		name: 'Tax-deferred',
		color: 'var(--viz-2)',
		values: rows.map((r, i) => display(r.deferredCents, i)),
	},
	{
		name: 'Roth',
		color: 'var(--viz-3)',
		values: rows.map((r, i) => display(r.rothCents, i)),
	},
]);

const incomeStacks = $derived([
	{
		name: 'Salary',
		color: 'var(--viz-1)',
		values: rows.map((r, i) => display(r.salaryCents, i)),
	},
	{
		name: 'FERS annuity',
		color: 'var(--viz-2)',
		values: rows.map((r, i) => display(r.fersAnnuityCents + r.srsCents, i)),
	},
	{
		name: 'Social Security',
		color: 'var(--viz-3)',
		values: rows.map((r, i) => display(r.ssBenefitCents, i)),
	},
	{
		name: 'Investment returns',
		color: 'var(--viz-4)',
		values: rows.map((r, i) => display(r.investmentGrowthCents, i)),
	},
	{
		name: 'Employer benefits (in-kind)',
		color: 'var(--viz-5)',
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
		'var(--viz-1)',
		'var(--viz-2)',
		'var(--viz-3)',
		'var(--viz-4)',
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
			color: 'var(--viz-5)',
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
		color: 'var(--viz-1)',
		values: rows.map((r, i) => display(r.federalTaxCents, i)),
	},
	{
		name: 'FICA',
		color: 'var(--viz-2)',
		values: rows.map((r, i) => display(r.ficaCents, i)),
	},
	{
		name: 'State',
		color: 'var(--viz-3)',
		values: rows.map((r, i) => display(r.stateTaxCents, i)),
	},
	{
		name: 'Capital gains',
		color: 'var(--viz-4)',
		values: rows.map((r, i) => display(r.capitalGainsTaxCents, i)),
	},
	{
		name: 'Early-withdrawal penalty',
		color: 'var(--viz-5)',
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
</script>

<h1>Projection</h1>

<form method="POST" action="?/save" use:enhance class="knobs">
	<div class="knob-row">
		<label class="knob wide">
			<span>Retirement age <strong>{retirementAge}</strong></span>
			<input type="range" min="40" max="70" bind:value={retirementAge} />
			<input type="hidden" name="retirementAge" value={retirementAge} />
		</label>
		<label class="knob">
			<span>SS claim age</span>
			<input type="number" min="62" max="70" bind:value={ssClaimingAge} />
			<input type="hidden" name="ssClaimingAge" value={ssClaimingAge} />
		</label>
		<label class="knob">
			<span>Return %/yr</span>
			<input type="number" step="0.5" min="0" max="15" bind:value={returnPctInput} />
			<input type="hidden" name="nominalReturnPct" value={returnPctInput / 100} />
		</label>
		<label class="knob">
			<span>Inflation %/yr</span>
			<input type="number" step="0.25" min="0" max="10" bind:value={inflationPctInput} />
			<input type="hidden" name="inflationPct" value={inflationPctInput / 100} />
		</label>
		<label class="knob toggle">
			<span>Display</span>
			<span class="toggle-row">
				<input type="checkbox" bind:checked={showReal} />
				today's $
			</span>
		</label>
		<button type="submit">Save as defaults</button>
		{#if form?.error}<span class="error">{form.error}</span>{/if}
	</div>

	<details class="more">
		<summary>More assumptions</summary>
		<div class="knob-row">
			<label class="knob">
				<span>Birth date</span>
				<input type="date" name="birthDate" bind:value={birthDate} />
			</label>
			<label class="knob">
				<span>State tax %</span>
				<input type="number" step="0.25" min="0" max="15" bind:value={stateTaxPctInput} />
				<input type="hidden" name="stateTaxPct" value={stateTaxPctInput / 100} />
			</label>
			<label class="knob">
				<span>End-of-plan age</span>
				<input type="number" name="endAge" min="70" max="110" bind:value={endAge} />
			</label>
			<label class="knob toggle">
				<span>Wage growth</span>
				<span class="toggle-row">
					<input type="checkbox" bind:checked={wageTracksInflation} />
					track inflation
				</span>
			</label>
			{#if !wageTracksInflation}
				<label class="knob">
					<span>Wage growth %/yr</span>
					<input type="number" step="0.25" min="0" max="10" bind:value={wageGrowthPctInput} />
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

<section class="tiles">
	<div class="tile">
		<span class="label">Plan status</span>
		{#if projection.firstShortfallAge === null}
			<span class="value ok">Funded to {endAge}</span>
		{:else}
			<span class="value bad">⚠ Shortfall at {projection.firstShortfallAge}</span>
		{/if}
	</div>
	<div class="tile">
		<span class="label">Net worth at {retirementAge}</span>
		<span class="value">{formatCents(netWorthAtRetirement)}</span>
	</div>
	<div class="tile">
		<span class="label">
			FERS annuity from {fersAnnuityDisplay?.age ?? '—'}
			{#if fersAnnuityDisplay?.deferred}(deferred){/if}
		</span>
		<span class="value">
			{fersAnnuityDisplay ? `${formatCents(fersAnnuityDisplay.annual)}/yr` : 'not eligible'}
		</span>
	</div>
	<div class="tile">
		<span class="label">Social Security at {ssClaimingAge}</span>
		<span class="value">{formatCents(projection.ssMonthlyAtClaimTodayCents)}/mo</span>
	</div>
</section>

<div class="charts">
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

<details>
	<summary>Year-by-year table</summary>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th>Year</th>
					<th>Age</th>
					<th class="num">Salary</th>
					<th class="num">FERS</th>
					<th class="num">Soc. Sec.</th>
					<th class="num">Returns</th>
					<th class="num">Withdrawals</th>
					<th class="num">Taxes</th>
					<th class="num">Expenses</th>
					<th class="num">Net cash flow</th>
					<th class="num">Net worth</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r, i (r.year)}
					<tr class:shortfall={r.shortfallCents > 0} class:separation={r.age === retirementAge}>
						<td>{r.year}</td>
						<td>{r.age}</td>
						<td class="num">{r.salaryCents ? formatCents(display(r.salaryCents, i)) : '—'}</td>
						<td class="num">
							{r.fersAnnuityCents + r.srsCents
								? formatCents(display(r.fersAnnuityCents + r.srsCents, i))
								: '—'}
						</td>
						<td class="num">
							{r.ssBenefitCents ? formatCents(display(r.ssBenefitCents, i)) : '—'}
						</td>
						<td class="num">
							{r.investmentGrowthCents
								? formatCents(display(r.investmentGrowthCents, i))
								: '—'}
						</td>
						<td class="num">
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
						<td class="num">
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
						<td class="num">{formatCents(display(r.expensesCents, i))}</td>
						<td class="num">{formatCents(display(r.netCashFlowCents, i))}</td>
						<td class="num">{formatCents(display(r.netWorthCents, i))}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</details>

<p class="footnote">
	All amounts in {unit}. Constants (tax brackets, bend points, limits) are 2026
	figures — see <code>src/lib/engine/constants.ts</code>.
	{#if projection.fers.eligible && !projection.fers.immediate}
		Retiring at {retirementAge} is before FERS immediate eligibility: the annuity
		defers to 62 with the high-3 frozen at separation, and there is no retiree
		health coverage or SRS — make sure an expense row covers private health
		insurance.
	{/if}
</p>

<style>
	.knobs {
		padding: 0.9rem 1rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.knob-row {
		display: flex;
		align-items: end;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.more {
		margin-top: 0.6rem;
	}

	.more summary {
		cursor: pointer;
		font-size: 0.85rem;
		color: var(--ink-secondary);
		padding: 0.2rem 0;
	}

	.more .knob-row {
		padding-top: 0.6rem;
	}

	.knob {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.85rem;
		color: var(--ink-secondary);
	}

	.knob.wide {
		min-width: 16rem;
	}

	.knob input[type='number'] {
		width: 5rem;
		padding: 0.3rem 0.45rem;
		font-size: 0.95rem;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0;
	}

	.knobs button {
		padding: 0.45rem 0.9rem;
		font-size: 0.9rem;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.tile {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 0.9rem 1rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}

	.tile .label {
		font-size: 0.8rem;
		color: var(--ink-secondary);
	}

	.tile .value {
		font-size: 1.35rem;
		font-weight: 600;
	}

	.tile .value.ok {
		color: var(--success);
	}

	.tile .value.bad {
		color: var(--error);
	}

	.charts {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	details {
		margin-bottom: 1rem;
	}

	summary {
		cursor: pointer;
		color: var(--ink-secondary);
		padding: 0.5rem 0;
	}

	.table-wrap {
		overflow-x: auto;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
	}

	table {
		border-collapse: collapse;
		width: 100%;
		font-size: 0.85rem;
	}

	th,
	td {
		text-align: left;
		padding: 0.3rem 0.6rem;
		border-bottom: 1px solid var(--border);
		white-space: nowrap;
	}

	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	tr.shortfall td {
		color: var(--error);
	}

	tr.separation td {
		border-top: 2px solid var(--axis);
	}

	.footnote {
		font-size: 0.8rem;
		color: var(--muted);
		max-width: 46rem;
	}

	.error {
		color: var(--error);
	}
</style>
