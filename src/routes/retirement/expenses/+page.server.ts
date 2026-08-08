import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { parseDollarsToCents } from '$lib/argent/format';
import { db } from '$lib/db';
import {
	EXPENSE_APPLIES,
	type ExpenseApplies,
	expenses,
} from '$lib/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { expenses: db.select().from(expenses).all() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const annualCents = parseDollarsToCents(String(form.get('annual') ?? ''));
		const applies = String(form.get('applies') ?? 'always') as ExpenseApplies;

		if (!name || annualCents == null || !EXPENSE_APPLIES.includes(applies)) {
			return fail(400, { error: 'Name and annual amount are required.' });
		}

		db.insert(expenses).values({ name, annualCents, applies }).run();
		return { success: true };
	},

	// Inline edit of amount and applies.
	update: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const annualCents = parseDollarsToCents(String(form.get('annual') ?? ''));
		const applies = String(form.get('applies') ?? '') as ExpenseApplies;
		if (annualCents == null || !EXPENSE_APPLIES.includes(applies)) {
			return fail(400, { error: 'Invalid amount.' });
		}
		db.update(expenses)
			.set({ annualCents, applies })
			.where(eq(expenses.id, id))
			.run();
		return { success: true };
	},

	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		db.delete(expenses).where(eq(expenses.id, id)).run();
		return { success: true };
	},
};
