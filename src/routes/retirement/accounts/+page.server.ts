import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { parseDollarsToCents } from '$lib/argent/format';
import { parseBalancesCsv } from '$lib/services/argent/balances';
import { db } from '$lib/db';
import {
	ACCOUNT_KINDS,
	type AccountKind,
	accounts,
} from '$lib/db/schema';
import { bucketsFromAccounts } from '$lib/services/argent/inputs';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = db.select().from(accounts).all();
	return {
		accounts: rows,
		buckets: bucketsFromAccounts(rows),
		accountKinds: ACCOUNT_KINDS,
	};
};

const isRothKind = (kind: AccountKind) =>
	kind === 'tsp-roth' || kind === 'ira-roth';

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const kind = String(form.get('kind') ?? '') as AccountKind;
		const balanceCents = parseDollarsToCents(String(form.get('balance') ?? ''));
		const rothBasisRaw = String(form.get('rothBasis') ?? '').trim();
		const rothBasisCents =
			rothBasisRaw === '' ? null : parseDollarsToCents(rothBasisRaw);

		if (!name || balanceCents == null || !ACCOUNT_KINDS.includes(kind)) {
			return fail(400, { error: 'Name, kind, and balance are required.' });
		}
		if (isRothKind(kind) && rothBasisCents == null) {
			return fail(400, { error: 'Roth accounts need a contribution basis.' });
		}

		db.insert(accounts)
			.values({
				name,
				kind,
				balanceCents,
				rothBasisCents: isRothKind(kind) ? rothBasisCents : null,
			})
			.run();
		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		db.delete(accounts).where(eq(accounts.id, id)).run();
		return { success: true };
	},

	// Inline edit of balance (and basis where applicable).
	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const account = db.select().from(accounts).where(eq(accounts.id, id)).get();
		if (!account) {
			return fail(404, { error: 'Account not found.' });
		}

		const balanceCents = parseDollarsToCents(String(form.get('balance') ?? ''));
		if (balanceCents == null || balanceCents < 0) {
			return fail(400, { error: `Invalid balance for "${account.name}".` });
		}

		let rothBasisCents = account.rothBasisCents;
		if (isRothKind(account.kind)) {
			rothBasisCents = parseDollarsToCents(String(form.get('rothBasis') ?? ''));
			if (rothBasisCents == null || rothBasisCents < 0) {
				return fail(400, {
					error: `Invalid Roth basis for "${account.name}".`,
				});
			}
		}

		let costBasisCents = account.costBasisCents;
		if (account.kind === 'taxable') {
			const raw = String(form.get('costBasis') ?? '').trim();
			costBasisCents = raw === '' ? null : parseDollarsToCents(raw);
			if (costBasisCents != null && costBasisCents < 0) {
				return fail(400, {
					error: `Invalid cost basis for "${account.name}".`,
				});
			}
		}

		db.update(accounts)
			.set({ balanceCents, rothBasisCents, costBasisCents })
			.where(eq(accounts.id, id))
			.run();
		return { success: true };
	},

	// Parse an uploaded balances CSV; nothing persists until importSave.
	importBalances: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('balances');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose a balances CSV to import.' });
		}
		if (file.size > 20 * 1024 * 1024) {
			return fail(400, {
				error: 'That file is too large to be a balances export.',
			});
		}
		const parsed = parseBalancesCsv(await file.text());
		if (parsed.accounts.length === 0) {
			return fail(400, {
				error: parsed.warnings[0] ?? 'No importable accounts found.',
			});
		}
		return { parsed };
	},

	// Bulk-insert the reviewed rows from an import.
	importSave: async ({ request }) => {
		const form = await request.formData();
		let rows: unknown;
		try {
			rows = JSON.parse(String(form.get('rows') ?? ''));
		} catch {
			return fail(400, { error: 'Malformed import payload.' });
		}
		if (!Array.isArray(rows) || rows.length === 0) {
			return fail(400, { error: 'No accounts selected.' });
		}

		const values = [];
		for (const row of rows) {
			const name = String((row as Record<string, unknown>).name ?? '').trim();
			const kind = (row as Record<string, unknown>).kind as AccountKind;
			const balanceCents = (row as Record<string, unknown>).balanceCents;
			const rothBasisCents =
				(row as Record<string, unknown>).rothBasisCents ?? null;

			if (!name || !ACCOUNT_KINDS.includes(kind)) {
				return fail(400, { error: `Invalid row: "${name || '(unnamed)'}".` });
			}
			if (!Number.isInteger(balanceCents) || (balanceCents as number) <= 0) {
				return fail(400, { error: `Invalid balance for "${name}".` });
			}
			if (isRothKind(kind) && !Number.isInteger(rothBasisCents)) {
				return fail(400, {
					error: `"${name}" is a Roth account — enter its contribution basis.`,
				});
			}
			values.push({
				name,
				kind,
				balanceCents: balanceCents as number,
				rothBasisCents: isRothKind(kind) ? (rothBasisCents as number) : null,
			});
		}

		db.insert(accounts).values(values).run();
		return { imported: values.length };
	},
};
