import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { assumptions } from '$lib/db/schema';
import { getAssumptions, getEngineInputs } from '$lib/services/argent/inputs';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { inputs: getEngineInputs() };
};

export const actions: Actions = {
	// Persist the dashboard knobs — the single home for all assumptions.
	save: async ({ request }) => {
		const form = await request.formData();
		const birthDate = String(form.get('birthDate') ?? '');
		const retirementAge = Number(form.get('retirementAge'));
		const ssClaimingAge = Number(form.get('ssClaimingAge'));
		const nominalReturnPct = Number(form.get('nominalReturnPct'));
		const inflationPct = Number(form.get('inflationPct'));
		const stateTaxPct = Number(form.get('stateTaxPct'));
		const endAge = Number(form.get('endAge'));
		// Empty string = wage growth tracks inflation (stored as NULL).
		const wageGrowthRaw = String(form.get('wageGrowthPct') ?? '');
		const wageGrowthPct = wageGrowthRaw === '' ? null : Number(wageGrowthRaw);

		if (
			!/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
			!Number.isInteger(retirementAge) ||
			!Number.isInteger(ssClaimingAge) ||
			ssClaimingAge < 62 ||
			ssClaimingAge > 70 ||
			!Number.isInteger(endAge) ||
			!Number.isFinite(nominalReturnPct) ||
			!Number.isFinite(inflationPct) ||
			!Number.isFinite(stateTaxPct) ||
			(wageGrowthPct !== null && !Number.isFinite(wageGrowthPct))
		) {
			return fail(400, {
				error: 'Invalid values; SS claiming age must be 62–70.',
			});
		}

		getAssumptions(); // ensure the row exists
		db.update(assumptions)
			.set({
				birthDate,
				retirementAge,
				ssClaimingAge,
				nominalReturnPct,
				inflationPct,
				stateTaxPct,
				endAge,
				wageGrowthPct,
			})
			.where(eq(assumptions.id, 1))
			.run();
		return { success: true };
	},
};
