<script lang="ts">
import { enhance } from '$app/forms';
import {
	centsToDollarsInput as dollars,
	formatCents,
	parseDollarsToCents,
} from '$lib/argent/format';
import type { PageProps } from './$types';

let { data, form }: PageProps = $props();

let kind = $state('tsp-traditional');
const isRoth = $derived(kind === 'tsp-roth' || kind === 'ira-roth');

const KIND_LABELS: Record<string, string> = {
	'tsp-traditional': 'TSP (traditional)',
	'tsp-roth': 'TSP (Roth)',
	'ira-traditional': 'IRA (traditional)',
	'ira-roth': 'IRA (Roth)',
	taxable: 'Taxable brokerage',
	cash: 'Cash',
};

// --- CSV import review state ---

interface ImportRow {
	include: boolean;
	name: string;
	kind: string;
	balanceCents: number;
	lastDate: string;
	rothBasis: string; // dollars text, filled by hand for Roth kinds
}

const parsed = $derived(form && 'parsed' in form ? form.parsed : null);
const imported = $derived(form && 'imported' in form ? form.imported : null);

let importRows = $state<ImportRow[]>([]);
$effect(() => {
	importRows = (parsed?.accounts ?? []).map((a) => ({
		include: true,
		name: a.name,
		kind: a.suggestedKind,
		balanceCents: a.balanceCents,
		lastDate: a.lastDate,
		rothBasis: '',
	}));
});

const rowIsRoth = (r: ImportRow) =>
	r.kind === 'tsp-roth' || r.kind === 'ira-roth';

const selectedRows = $derived(importRows.filter((r) => r.include));
const importPayload = $derived(
	JSON.stringify(
		selectedRows.map((r) => ({
			name: r.name,
			kind: r.kind,
			balanceCents: r.balanceCents,
			rothBasisCents: rowIsRoth(r) ? parseDollarsToCents(r.rothBasis) : null,
		})),
	),
);
const missingBasis = $derived(
	selectedRows.some(
		(r) => rowIsRoth(r) && parseDollarsToCents(r.rothBasis) == null,
	),
);
</script>

<h1>Accounts</h1>

<p class="hint">
	Current balances. The engine folds these into three buckets: taxable,
	tax-deferred, and Roth. Basis matters for taxes: Roth basis is
	withdrawable any time; taxable cost basis (from your brokerage's
	unrealized-gains page) determines capital-gains tax on withdrawals —
	blank means "no embedded gains," which understates future tax.
</p>

<section class="buckets">
	<div><span class="label">Cash</span><span>{formatCents(data.buckets.cashCents)}</span></div>
	<div><span class="label">Taxable</span><span>{formatCents(data.buckets.taxableCents)}</span></div>
	<div>
		<span class="label">Tax-deferred</span><span>{formatCents(data.buckets.deferredCents)}</span>
	</div>
	<div>
		<span class="label">Roth</span><span>{formatCents(data.buckets.rothCents)}</span>
	</div>
	<div>
		<span class="label">Roth basis</span><span>{formatCents(data.buckets.rothBasisCents)}</span>
	</div>
</section>

<form
	method="POST"
	action="?/importBalances"
	enctype="multipart/form-data"
	use:enhance
	class="import-row"
>
	<label class="file-label">
		Import balances CSV (Date,Balance,Account)
		<input name="balances" type="file" accept=".csv,text/csv" required />
	</label>
	<button type="submit">Parse CSV</button>
</form>

{#if imported != null}
	<div class="banner">
		<strong>Imported {imported} account{imported === 1 ? '' : 's'}.</strong>
	</div>
{/if}

{#if parsed && importRows.length > 0}
	<div class="banner">
		<strong>Found {parsed.accounts.length} accounts</strong>
		{#if parsed.asOfDate}(balances as of {parsed.asOfDate}){/if}
		— uncheck anything that shouldn't be modeled (a spouse's account, a
		sinking fund…), fix kinds, add Roth basis where asked, then import.
		{#if importRows.some((r) => r.kind === 'tsp-traditional' && /thrift|tsp/i.test(r.name))}
			<span class="note">
				The CSV shows one combined TSP balance — it can't see your
				traditional/Roth split. Import it, then split it into two rows
				(TSP traditional / TSP Roth) using your TSP statement.
			</span>
		{/if}
		{#if parsed.skipped.length > 0}
			<span class="note">
				Skipped (zero or negative): {parsed.skipped.map((s) => s.name).join(', ')}
			</span>
		{/if}
		{#each parsed.warnings as w (w)}
			<span class="warning">⚠ {w}</span>
		{/each}
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th></th>
					<th>Name</th>
					<th>Kind</th>
					<th class="num">Balance</th>
					<th class="num">Roth basis ($)</th>
					<th>Last update</th>
				</tr>
			</thead>
			<tbody>
				{#each importRows as row, i (i)}
					<tr class:excluded={!row.include}>
						<td><input type="checkbox" bind:checked={row.include} /></td>
						<td><input class="name-input" bind:value={row.name} disabled={!row.include} /></td>
						<td>
							<select bind:value={row.kind} disabled={!row.include}>
								{#each data.accountKinds as k (k)}
									<option value={k}>{KIND_LABELS[k]}</option>
								{/each}
							</select>
						</td>
						<td class="num">{formatCents(row.balanceCents)}</td>
						<td class="num">
							{#if rowIsRoth(row)}
								<input
									class="basis-input"
									bind:value={row.rothBasis}
									placeholder="required"
									disabled={!row.include}
								/>
							{:else}
								—
							{/if}
						</td>
						<td>{row.lastDate}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<form method="POST" action="?/importSave" use:enhance class="import-actions">
		<input type="hidden" name="rows" value={importPayload} />
		<button type="submit" disabled={selectedRows.length === 0 || missingBasis}>
			Import {selectedRows.length} selected
		</button>
		{#if missingBasis}
			<span class="warning">Enter a contribution basis for the selected Roth accounts.</span>
		{/if}
	</form>
{/if}

{#if form?.error}<p class="error">{form.error}</p>{/if}

{#if data.accounts.length > 0}
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Kind</th>
				<th class="num">Balance</th>
				<th class="num">Basis</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each data.accounts as account (account.id)}
				<tr>
					<td>{account.name}</td>
					<td>{KIND_LABELS[account.kind] ?? account.kind}</td>
					<td class="num">
						<input
							class="cell-input"
							name="balance"
							form="acct-{account.id}"
							value={dollars(account.balanceCents)}
							required
						/>
					</td>
					<td class="num">
						{#if account.kind === 'tsp-roth' || account.kind === 'ira-roth'}
							<input
								class="cell-input"
								name="rothBasis"
								form="acct-{account.id}"
								value={dollars(account.rothBasisCents ?? 0)}
								required
							/>
						{:else if account.kind === 'taxable'}
							<input
								class="cell-input"
								name="costBasis"
								form="acct-{account.id}"
								value={account.costBasisCents != null ? dollars(account.costBasisCents) : ''}
								placeholder="= balance"
							/>
						{:else}
							—
						{/if}
					</td>
					<td class="row-actions">
						<form id="acct-{account.id}" method="POST" action="?/update" use:enhance>
							<input type="hidden" name="id" value={account.id} />
							<button type="submit" class="link save">save</button>
						</form>
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="id" value={account.id} />
							<button type="submit" class="link">delete</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No accounts yet.</p>
{/if}

<h2>Add account</h2>

<form method="POST" action="?/create" use:enhance class="inline">
	<label>
		Name
		<input name="name" required />
	</label>
	<label>
		Kind
		<select name="kind" bind:value={kind}>
			{#each data.accountKinds as k (k)}
				<option value={k}>{KIND_LABELS[k]}</option>
			{/each}
		</select>
	</label>
	<label>
		Balance ($)
		<input name="balance" required />
	</label>
	{#if isRoth}
		<label>
			Contribution basis ($)
			<input name="rothBasis" required />
		</label>
	{/if}
	<button type="submit">Add</button>
</form>

<style>
	.hint {
		color: var(--ink-secondary);
		max-width: 40rem;
	}

	.buckets {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.buckets div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		padding: 0.75rem 1rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 0.5rem;
		font-weight: 600;
	}

	.buckets .label {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--ink-secondary);
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
		max-width: 52rem;
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

	.banner .note {
		color: var(--ink-secondary);
	}

	.banner .warning,
	.import-actions .warning {
		color: var(--error);
	}

	.table-wrap {
		overflow-x: auto;
		margin-bottom: 0.75rem;
	}

	.import-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	tr.excluded {
		opacity: 0.45;
	}

	.name-input {
		width: 100%;
		min-width: 14rem;
		box-sizing: border-box;
	}

	.basis-input {
		width: 7.5rem;
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

	input[type='checkbox'] {
		padding: 0;
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
