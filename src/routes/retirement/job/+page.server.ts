import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { parseDollarsToCents, parsePctToFraction } from '$lib/argent/format';
import { db } from '$lib/db';
import { earningsHistory, job } from '$lib/db/schema';
import { getJob } from '$lib/services/argent/inputs';
import { parseLesPdf } from '$lib/services/argent/les';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		job: getJob(),
		earnings: db
			.select()
			.from(earningsHistory)
			.all()
			.sort((a, b) => a.year - b.year),
	};
};

export const actions: Actions = {
	save: async ({ request }) => {
		const form = await request.formData();
		const salaryCents = parseDollarsToCents(String(form.get('salary') ?? ''));
		const serviceStartDate = String(form.get('serviceStartDate') ?? '');
		const tspTraditionalPct = parsePctToFraction(
			String(form.get('tspTraditional') ?? ''),
		);
		const tspRothPct = parsePctToFraction(String(form.get('tspRoth') ?? ''));
		const fersContributionPct = parsePctToFraction(
			String(form.get('fersContribution') ?? ''),
		);
		const employerHealthCents = parseDollarsToCents(
			String(form.get('employerHealth') ?? ''),
		);
		const employeeHealthCents = parseDollarsToCents(
			String(form.get('employeeHealth') ?? ''),
		);

		if (
			salaryCents == null ||
			tspTraditionalPct == null ||
			tspRothPct == null ||
			fersContributionPct == null ||
			employerHealthCents == null ||
			employeeHealthCents == null ||
			!/^\d{4}-\d{2}-\d{2}$/.test(serviceStartDate)
		) {
			return fail(400, {
				error: 'All fields are required (dates as YYYY-MM-DD).',
			});
		}

		getJob(); // ensure the row exists
		db.update(job)
			.set({
				salaryCents,
				serviceStartDate,
				tspTraditionalPct,
				tspRothPct,
				fersContributionPct,
				employerHealthCents,
				employeeHealthCents,
			})
			.where(eq(job.id, 1))
			.run();
		return { success: true };
	},

	addEarnings: async ({ request }) => {
		const form = await request.formData();
		const year = Number(form.get('year'));
		const earningsCents = parseDollarsToCents(
			String(form.get('earnings') ?? ''),
		);
		if (
			!Number.isInteger(year) ||
			year < 1950 ||
			year > 2100 ||
			earningsCents == null
		) {
			return fail(400, { error: 'Enter a valid year and amount.' });
		}
		db.insert(earningsHistory)
			.values({ year, earningsCents })
			.onConflictDoUpdate({
				target: earningsHistory.year,
				set: { earningsCents },
			})
			.run();
		return { success: true };
	},

	deleteEarnings: async ({ request }) => {
		const form = await request.formData();
		const year = Number(form.get('year'));
		db.delete(earningsHistory).where(eq(earningsHistory.year, year)).run();
		return { success: true };
	},

	// Parse an uploaded DFAS LES PDF and return the extracted fields; the
	// form is prefilled for review — nothing is saved until Save is clicked.
	importLes: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('les');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Choose an LES PDF to import.' });
		}
		if (file.size > 5 * 1024 * 1024) {
			return fail(400, { error: 'That file is too large to be an LES.' });
		}
		try {
			const parsed = await parseLesPdf(
				new Uint8Array(await file.arrayBuffer()),
			);
			return { parsed };
		} catch {
			return fail(400, { error: 'Could not read that file as a PDF.' });
		}
	},
};
