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

// Shared Tailwind fragments (ghost design language — see DESIGN.md)
const input =
	'bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2.5 py-1.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';
const cellInput =
	'bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors';
const btn =
	'px-3 py-1.5 bg-[var(--color-accent)] text-white rounded text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const label = 'flex flex-col gap-1 text-sm text-[var(--color-text-muted)]';
const th = 'text-left py-2 px-3 text-[var(--color-text-muted)] font-medium';
const td = 'py-2 px-3';
const bodyRow = 'border-b border-[var(--color-border)] last:border-b-0';
const banner =
	'py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] border-l-2 border-l-[var(--color-accent)] rounded-lg mb-4 text-sm flex flex-col gap-1';
</script>

<h2 class="text-xl font-semibold mb-2">Accounts</h2>

<p class="text-sm text-[var(--color-text-muted)] max-w-2xl mb-4">
	Current balances. The engine folds these into three buckets: taxable,
	tax-deferred, and Roth. Basis matters for taxes: Roth basis is
	withdrawable any time; taxable cost basis (from your brokerage's
	unrealized-gains page) determines capital-gains tax on withdrawals —
	blank means "no embedded gains," which understates future tax.
</p>

<section class="flex gap-4 mb-6 flex-wrap">
	{#each [
		{ name: 'Cash', cents: data.buckets.cashCents },
		{ name: 'Taxable', cents: data.buckets.taxableCents },
		{ name: 'Tax-deferred', cents: data.buckets.deferredCents },
		{ name: 'Roth', cents: data.buckets.rothCents },
		{ name: 'Roth basis', cents: data.buckets.rothBasisCents },
	] as { name, cents } (name)}
		<div class="flex flex-col gap-0.5 py-3 px-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg font-semibold">
			<span class="text-xs font-normal text-[var(--color-text-muted)]">{name}</span>
			<span>{formatCents(cents)}</span>
		</div>
	{/each}
</section>

<form
	method="POST"
	action="?/importBalances"
	enctype="multipart/form-data"
	use:enhance
	class="flex items-end gap-4 mb-4 flex-wrap"
>
	<label class={label}>
		Import balances CSV (Date,Balance,Account)
		<input class={input} name="balances" type="file" accept=".csv,text/csv" required />
	</label>
	<button type="submit" class={btn}>Parse CSV</button>
</form>

{#if imported != null}
	<div class="{banner} max-w-2xl">
		<strong>Imported {imported} account{imported === 1 ? '' : 's'}.</strong>
	</div>
{/if}

{#if parsed && importRows.length > 0}
	<div class="{banner} max-w-3xl">
		<strong>Found {parsed.accounts.length} accounts</strong>
		{#if parsed.asOfDate}(balances as of {parsed.asOfDate}){/if}
		— uncheck anything that shouldn't be modeled (a spouse's account, a
		sinking fund…), fix kinds, add Roth basis where asked, then import.
		{#if importRows.some((r) => r.kind === 'tsp-traditional' && /thrift|tsp/i.test(r.name))}
			<span class="text-[var(--color-text-muted)]">
				The CSV shows one combined TSP balance — it can't see your
				traditional/Roth split. Import it, then split it into two rows
				(TSP traditional / TSP Roth) using your TSP statement.
			</span>
		{/if}
		{#if parsed.skipped.length > 0}
			<span class="text-[var(--color-text-muted)]">
				Skipped (zero or negative): {parsed.skipped.map((s) => s.name).join(', ')}
			</span>
		{/if}
		{#each parsed.warnings as w (w)}
			<span class="text-[var(--color-error)]">⚠ {w}</span>
		{/each}
	</div>

	<div class="overflow-x-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mb-3">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)]">
					<th class={th}></th>
					<th class={th}>Name</th>
					<th class={th}>Kind</th>
					<th class="{th} text-right">Balance</th>
					<th class="{th} text-right">Roth basis ($)</th>
					<th class={th}>Last update</th>
				</tr>
			</thead>
			<tbody>
				{#each importRows as row, i (i)}
					<tr class="{bodyRow} {row.include ? '' : 'opacity-45'}">
						<td class={td}><input type="checkbox" class="accent-[var(--color-accent)]" bind:checked={row.include} /></td>
						<td class={td}>
							<input class="{cellInput} w-full min-w-56" bind:value={row.name} disabled={!row.include} />
						</td>
						<td class={td}>
							<select class={cellInput} bind:value={row.kind} disabled={!row.include}>
								{#each data.accountKinds as k (k)}
									<option value={k}>{KIND_LABELS[k]}</option>
								{/each}
							</select>
						</td>
						<td class="{td} text-right tabular-nums">{formatCents(row.balanceCents)}</td>
						<td class="{td} text-right">
							{#if rowIsRoth(row)}
								<input
									class="{cellInput} w-30 text-right"
									bind:value={row.rothBasis}
									placeholder="required"
									disabled={!row.include}
								/>
							{:else}
								—
							{/if}
						</td>
						<td class={td}>{row.lastDate}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<form method="POST" action="?/importSave" use:enhance class="flex items-center gap-4 mb-6">
		<input type="hidden" name="rows" value={importPayload} />
		<button type="submit" class={btn} disabled={selectedRows.length === 0 || missingBasis}>
			Import {selectedRows.length} selected
		</button>
		{#if missingBasis}
			<span class="text-sm text-[var(--color-error)]">Enter a contribution basis for the selected Roth accounts.</span>
		{/if}
	</form>
{/if}

{#if form?.error}<p class="text-sm text-[var(--color-error)] mb-4">{form.error}</p>{/if}

{#if data.accounts.length > 0}
	<div class="overflow-x-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg mb-6">
		<table class="w-full border-collapse text-sm">
			<thead>
				<tr class="border-b border-[var(--color-border)]">
					<th class={th}>Name</th>
					<th class={th}>Kind</th>
					<th class="{th} text-right">Balance</th>
					<th class="{th} text-right">Basis</th>
					<th class={th}></th>
				</tr>
			</thead>
			<tbody>
				{#each data.accounts as account (account.id)}
					<tr class={bodyRow}>
						<td class={td}>{account.name}</td>
						<td class={td}>{KIND_LABELS[account.kind] ?? account.kind}</td>
						<td class="{td} text-right">
							<input
								class="{cellInput} w-32 text-right"
								name="balance"
								form="acct-{account.id}"
								value={dollars(account.balanceCents)}
								required
							/>
						</td>
						<td class="{td} text-right">
							{#if account.kind === 'tsp-roth' || account.kind === 'ira-roth'}
								<input
									class="{cellInput} w-32 text-right"
									name="rothBasis"
									form="acct-{account.id}"
									value={dollars(account.rothBasisCents ?? 0)}
									required
								/>
							{:else if account.kind === 'taxable'}
								<input
									class="{cellInput} w-32 text-right"
									name="costBasis"
									form="acct-{account.id}"
									value={account.costBasisCents != null ? dollars(account.costBasisCents) : ''}
									placeholder="= balance"
								/>
							{:else}
								—
							{/if}
						</td>
						<td class={td}>
							<div class="flex gap-3 items-center">
								<form id="acct-{account.id}" method="POST" action="?/update" use:enhance>
									<input type="hidden" name="id" value={account.id} />
									<button type="submit" class="text-xs text-[var(--color-success)] hover:underline">save</button>
								</form>
								<form method="POST" action="?/delete" use:enhance>
									<input type="hidden" name="id" value={account.id} />
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
	<p class="text-[var(--color-text-muted)] mb-6">No accounts yet.</p>
{/if}

<h3 class="text-lg font-semibold mb-3">Add account</h3>

<form method="POST" action="?/create" use:enhance class="flex items-end gap-4 flex-wrap">
	<label class={label}>
		Name
		<input class={input} name="name" required />
	</label>
	<label class={label}>
		Kind
		<select class={input} name="kind" bind:value={kind}>
			{#each data.accountKinds as k (k)}
				<option value={k}>{KIND_LABELS[k]}</option>
			{/each}
		</select>
	</label>
	<label class={label}>
		Balance ($)
		<input class={input} name="balance" required />
	</label>
	{#if isRoth}
		<label class={label}>
			Contribution basis ($)
			<input class={input} name="rothBasis" required />
		</label>
	{/if}
	<button type="submit" class={btn}>Add</button>
</form>
